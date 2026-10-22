import { Router } from "express";
import { z } from "zod";
import { automationsService } from "../../../services/automations.service.js";
import { withGuild, withGuildExecutor } from "../../http/guildContext.js";
import { sendRouteError } from "../../http/errors.js";
import { snowflakeSchema } from "../../http/schemas.js";

export const automationsRouter = Router({ mergeParams: true });
const automationSchema = z.object({
  welcomeEnabled: z.boolean(),
  welcomeChannelId: snowflakeSchema.nullable(),
  welcomeMessage: z.string().trim().min(1).max(2000),
  leaveEnabled: z.boolean(),
  leaveChannelId: snowflakeSchema.nullable(),
  leaveMessage: z.string().trim().min(1).max(2000),
});

automationsRouter.get("/", async (_req, res) => {
  try {
    await withGuild(res, async (guild) => {
      res.json(await automationsService.get(guild));
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar as automações.",
      logMessage: "Falha ao carregar automações do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

automationsRouter.patch("/", async (req, res) => {
  const parsed = automationSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Confira os canais e mensagens automáticas." });
    return;
  }
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      await automationsService.update(guild, parsed.data, executor);
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "Não foi possível salvar as automações.",
      logMessage: "Falha ao salvar automações do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});
