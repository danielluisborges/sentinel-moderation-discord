import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { authRouter } from "./routes/auth.js";
import { guildsRouter } from "./routes/guilds.js";
import { membersRouter } from "./routes/members.js";
import { bansRouter } from "./routes/bans.js";
import { channelsRouter } from "./routes/channels.js";
import { overviewRouter } from "./routes/overview.js";
import { moderationRouter } from "./routes/moderation.js";
import { configRouter } from "./routes/config/index.js";

export function createWebApp() {
  const app = express();
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", "data:", "https://cdn.discordapp.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Muitas requisições. Tente novamente em alguns minutos.",
      },
    }),
  );
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", authRouter);
  app.use("/api/guilds", guildsRouter);
  app.use("/api/guilds/:guildId/overview", overviewRouter);
  app.use("/api/guilds/:guildId/members", membersRouter);
  app.use("/api/guilds/:guildId/bans", bansRouter);
  app.use("/api/guilds/:guildId/moderation", moderationRouter);
  app.use("/api/guilds/:guildId/config", configRouter);
  app.use("/api/guilds/:guildId/channels", channelsRouter);
  if (env.NODE_ENV === "production") {
    const panelDirectory = fileURLToPath(
      new URL("../../panel/dist/", import.meta.url),
    );
    app.use(express.static(panelDirectory, { index: false }));
    app.use((req, res, next) => {
      if (
        req.method !== "GET" ||
        req.path.startsWith("/api") ||
        req.path.startsWith("/auth") ||
        req.path === "/health" ||
        !req.accepts("html")
      ) {
        next();
        return;
      }
      res.sendFile(join(panelDirectory, "index.html"), (error) => {
        if (error) next(error);
      });
    });
  }
  app.use((_req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      void next;
      logger.error({ err: error }, "Falha na API web");
      if (!res.headersSent)
        res.status(500).json({ error: "Erro interno do servidor." });
    },
  );
  return app;
}

export function startWebServer() {
  const app = createWebApp();
  const host = env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  return app.listen(env.PORT, host, () => {
    logger.info({ port: env.PORT, host }, "API web do Sentinel iniciada");
  });
}
