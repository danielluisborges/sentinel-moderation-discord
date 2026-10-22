import { Router } from "express";
import { z } from "zod";
import { moderationService } from "../../services/moderation.service.js";
import { requireGuildAccess } from "../middleware/requireGuildAccess.js";
import { withGuildExecutor } from "../http/guildContext.js";
import { sendRouteError } from "../http/errors.js";

export const moderationRouter = Router({ mergeParams: true });
moderationRouter.use(...requireGuildAccess);

const actionSchema = z.object({
  action: z.enum(["ban", "kick", "warn", "timeout", "untimeout"]),
  userId: z.string().regex(/^\d{15,22}$/),
  reason: z.string().trim().max(512).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(40_320).optional(),
});

moderationRouter.post("/actions", async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Confira a ação, o usuário, o motivo e a duração do timeout.",
    });
    return;
  }
  if (parsed.data.action === "timeout" && !parsed.data.durationMinutes) {
    res.status(400).json({ error: "Informe a duração do timeout em minutos." });
    return;
  }

  try {
    await withGuildExecutor(res, async (guild, executor) => {
      const input = {
        guild,
        executor,
        targetId: parsed.data.userId,
        source: "panel" as const,
        ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
      };

      switch (parsed.data.action) {
        case "ban":
          await moderationService.ban(input);
          break;
        case "kick":
          await moderationService.kick(input);
          break;
        case "warn":
          await moderationService.warn(input);
          break;
        case "timeout":
          await moderationService.timeout({
            ...input,
            durationMs: (parsed.data.durationMinutes ?? 1) * 60_000,
          });
          break;
        case "untimeout":
          await moderationService.removeTimeout(input);
          break;
      }
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu executar essa ação de moderação.",
      logMessage: "Falha ao executar ação de moderação pelo painel",
      context: {
        guildId: String(res.locals.guildId),
        userId: parsed.data.userId,
      },
    });
  }
});
