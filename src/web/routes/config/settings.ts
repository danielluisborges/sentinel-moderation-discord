import { Router } from "express";
import { z } from "zod";
import { settingsService } from "../../../services/settings.service.js";
import type { GuildSettingsUpdate } from "../../../services/settings.service.js";
import { withGuild } from "../../http/guildContext.js";
import { sendRouteError } from "../../http/errors.js";
import { snowflakeSchema } from "../../http/schemas.js";

export const settingsRouter = Router({ mergeParams: true });
const updateSchema = z
  .object({
    logChannelId: snowflakeSchema.nullable().optional(),
    modRoleId: snowflakeSchema.nullable().optional(),
    aiEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

settingsRouter.get("/", async (_req, res) => {
  try {
    await withGuild(res, async (guild) => {
      res.json(await settingsService.get(guild));
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar as configurações.",
      logMessage: "Falha ao carregar configurações do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

settingsRouter.patch("/", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Confira as configurações enviadas." });
    return;
  }
  try {
    await withGuild(res, async (guild) => {
      const updates: GuildSettingsUpdate = {
        ...(parsed.data.logChannelId !== undefined
          ? { logChannelId: parsed.data.logChannelId }
          : {}),
        ...(parsed.data.modRoleId !== undefined
          ? { modRoleId: parsed.data.modRoleId }
          : {}),
        ...(parsed.data.aiEnabled !== undefined
          ? { aiEnabled: parsed.data.aiEnabled }
          : {}),
      };
      await settingsService.update(guild, updates);
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "Não foi possível salvar as configurações.",
      logMessage: "Falha ao salvar configurações do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});
