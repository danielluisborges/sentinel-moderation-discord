import { randomBytes } from "node:crypto";
import { Router } from "express";
import { env } from "../../env.js";
import {
  discordAuthorizationUrl,
  exchangeCode,
  fetchDiscordUserId,
  removeSession,
} from "../auth/discordOAuth.js";
import {
  sessionCookieName,
  sessionDurationSeconds,
  sessionStore,
  signSession,
} from "../auth/session.js";
import { readCookie, requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();
const stateCookieName = "sentinel_oauth_state";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

authRouter.get("/discord", (req, res) => {
  const state = randomBytes(32).toString("base64url");
  try {
    const url = discordAuthorizationUrl(state);
    res.cookie(stateCookieName, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
    res.redirect(url);
  } catch {
    res.status(503).json({ error: "Configure OAuth do Discord no arquivo .env." });
  }
});

authRouter.get("/discord/callback", async (req, res) => {
  const stateCookie = readCookie(req.headers.cookie, stateCookieName);
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  res.clearCookie(stateCookieName, cookieOptions);

  if (!state || !stateCookie || state !== stateCookie || !code) {
    res.status(400).json({ error: "Retorno OAuth inválido. Inicie o login novamente." });
    return;
  }

  try {
    const credentials = await exchangeCode(code);
    const userId = await fetchDiscordUserId(credentials);
    const session = sessionStore.create(userId, credentials);
    const token = await signSession(session);
    res.cookie(sessionCookieName, token, {
      ...cookieOptions,
      maxAge: sessionDurationSeconds * 1000,
    });
    res.redirect(env.PANEL_URL ?? "/");
  } catch {
    res.status(502).json({ error: "Não foi possível concluir o login com o Discord." });
  }
});

authRouter.post("/logout", requireAuth, (req, res) => {
  if (res.locals.sentinelSession) removeSession(res.locals.sentinelSession.id);
  res.clearCookie(sessionCookieName, cookieOptions);
  res.status(204).end();
});
