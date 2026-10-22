import { Router } from "express";
import { z } from "zod";
import type { BanDTO, CreateBanRequest } from "../../shared/dto.js";
import { moderationService } from "../../services/moderation.service.js";
import { requireGuildAccess } from "../middleware/requireGuildAccess.js";
import { snowflakeSchema } from "../http/schemas.js";
import { withGuild, withGuildExecutor } from "../http/guildContext.js";
import { sendRouteError } from "../http/errors.js";

export const bansRouter = Router({ mergeParams: true });
bansRouter.use(...requireGuildAccess);
const createBanSchema: z.ZodType<CreateBanRequest> = z.object({
  userId: snowflakeSchema,
  reason: z.string().trim().max(512).optional(),
});

bansRouter.get("/", async (_req, res) => {
  try {
    await withGuild(res, async (guild) => {
      const bans = await guild.bans.fetch();
      const result: BanDTO[] = bans.map((ban) => ({
        userId: ban.user.id,
        username: ban.user.username,
        avatarUrl: ban.user.displayAvatarURL({ size: 128 }),
        reason: ban.reason ?? null,
      }));
      res.json(result);
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar os banimentos.",
      logMessage: "Falha ao carregar banimentos do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

bansRouter.post("/", async (req, res) => {
  const parsed = createBanSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error:
          "Informe um ID de usuário válido e um motivo de até 512 caracteres.",
      });
    return;
  }

  try {
    await withGuildExecutor(res, async (guild, executor) => {
      await moderationService.ban({
        guild,
        executor,
        targetId: parsed.data.userId,
        ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
        source: "panel",
      });
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu banir esse usuário.",
      logMessage: "Falha ao banir usuário pelo painel",
      context: {
        guildId: String(res.locals.guildId),
        userId: parsed.data.userId,
      },
    });
  }
});

bansRouter.delete("/:userId", async (req, res) => {
  const parsedId = snowflakeSchema.safeParse(req.params.userId);
  if (!parsedId.success) {
    res.status(400).json({ error: "ID de usuário inválido." });
    return;
  }

  try {
    await withGuildExecutor(res, async (guild, executor) => {
      await moderationService.unban({
        guild,
        executor,
        targetId: parsedId.data,
        source: "panel",
      });
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu remover esse banimento.",
      logMessage: "Falha ao remover banimento pelo painel",
      context: { guildId: String(res.locals.guildId), userId: parsedId.data },
    });
  }
});
