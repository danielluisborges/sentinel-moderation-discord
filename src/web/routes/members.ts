import { Router } from "express";
import { z } from "zod";
import { client } from "../../client.js";
import type {
  MemberDTO,
  MemberEditOptionsDTO,
  MemberPageDTO,
} from "../../shared/dto.js";
import { moderationService } from "../../services/moderation.service.js";
import { requireGuildAccess } from "../middleware/requireGuildAccess.js";
import { snowflakeSchema } from "../http/schemas.js";
import { sendRouteError } from "../http/errors.js";

export const membersRouter = Router({ mergeParams: true });
membersRouter.use(...requireGuildAccess);
const searchSchema = z.string().trim().min(2).max(100);
const cursorSchema = snowflakeSchema;
const limitSchema = z.coerce.number().int().min(1).max(100).default(50);

membersRouter.get("/", async (req, res) => {
  const query =
    typeof req.query.query === "string" ? req.query.query.trim() : "";
  const parsedQuery = query ? searchSchema.safeParse(query) : null;
  const parsedAfter =
    req.query.after === undefined
      ? null
      : cursorSchema.safeParse(req.query.after);
  const parsedLimit = limitSchema.safeParse(req.query.limit ?? 50);
  if (
    (parsedQuery && !parsedQuery.success) ||
    (parsedAfter && !parsedAfter.success) ||
    !parsedLimit.success
  ) {
    res
      .status(400)
      .json({ error: "A busca precisa ter entre 2 e 100 caracteres." });
    return;
  }

  try {
    const guild = client.guilds.cache.get(res.locals.guildId);
    if (!guild) {
      res.status(404).json({ error: "Servidor não encontrado pelo Sentinel." });
      return;
    }
    const members = query
      ? await guild.members.search({ query, limit: 20 })
      : await guild.members.list({
          limit: parsedLimit.data,
          ...(parsedAfter?.success ? { after: parsedAfter.data } : {}),
        });
    const result: MemberDTO[] = members.map((member) => ({
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
      avatarUrl: member.user.displayAvatarURL({ size: 128 }),
      isSentinel: member.id === client.user?.id,
      roles: member.roles.cache
        .filter((role) => role.id !== guild.id && !role.managed)
        .sort((a, b) => b.position - a.position)
        .map((role) => role.name)
        .slice(0, 4),
      roleIds: member.roles.cache
        .filter((role) => role.id !== guild.id && !role.managed)
        .map((role) => role.id),
      joinedAt: member.joinedAt?.toISOString() ?? null,
    }));
    const page: MemberPageDTO = {
      members: result,
      nextAfter:
        !query && result.length === parsedLimit.data
          ? (result[result.length - 1]?.id ?? null)
          : null,
    };
    res.json(page);
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: describeMembersError(error),
      logMessage: "Falha ao buscar membros do servidor para o painel",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

membersRouter.get("/:userId/edit-options", async (req, res) => {
  const userId = cursorSchema.safeParse(req.params.userId);
  if (!userId.success) {
    res.status(400).json({ error: "ID de membro inválido." });
    return;
  }
  try {
    const guild = client.guilds.cache.get(res.locals.guildId);
    const session = res.locals.sentinelSession;
    if (!guild || !session) {
      res.status(404).json({ error: "Servidor ou sessão não encontrados." });
      return;
    }
    const [member, executor, botMember] = await Promise.all([
      guild.members.fetch(userId.data),
      guild.members.fetch(session.userId),
      guild.members.me ?? guild.members.fetchMe(),
    ]);
    const editableRoles = guild.roles.cache
      .filter(
        (role) =>
          role.id !== guild.id &&
          !role.managed &&
          role.position < botMember.roles.highest.position &&
          (executor.id === guild.ownerId ||
            role.position < executor.roles.highest.position),
      )
      .sort((a, b) => b.position - a.position)
      .map(({ id, name }) => ({ id, name }));
    const result: MemberEditOptionsDTO = {
      nickname: member.nickname ?? "",
      roleIds: member.roles.cache
        .filter((role) => role.id !== guild.id && !role.managed)
        .map((role) => role.id),
      roles: editableRoles,
    };
    res.json(result);
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "Não foi possível carregar os dados do membro.",
      logMessage: "Falha ao carregar opções de edição de membro",
      context: { guildId: String(res.locals.guildId), userId: userId.data },
    });
  }
});

const updateMemberSchema = z.object({
  nickname: z.string().trim().max(32),
  roleIds: z.array(cursorSchema).max(250),
  reason: z.string().trim().max(512).optional(),
});

membersRouter.patch("/:userId", async (req, res) => {
  const userId = cursorSchema.safeParse(req.params.userId);
  const parsed = updateMemberSchema.safeParse(req.body);
  if (!userId.success || !parsed.success) {
    res.status(400).json({ error: "Confira o apelido, os cargos e o motivo." });
    return;
  }
  try {
    const guild = client.guilds.cache.get(res.locals.guildId);
    const session = res.locals.sentinelSession;
    if (!guild || !session) {
      res.status(404).json({ error: "Servidor ou sessão não encontrados." });
      return;
    }
    const executor = await guild.members.fetch(session.userId);
    await moderationService.editMember({
      guild,
      executor,
      targetId: userId.data,
      nickname: parsed.data.nickname || null,
      roleIds: parsed.data.roleIds,
      ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
      source: "panel",
    });
    res.status(204).end();
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu editar esse membro.",
      logMessage: "Falha ao editar membro pelo painel",
      context: { guildId: String(res.locals.guildId), userId: userId.data },
    });
  }
});

function describeMembersError(error: unknown): string {
  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; status?: unknown })
      : {};
  const code = typeof details.code === "number" ? details.code : null;
  const status = typeof details.status === "number" ? details.status : null;

  if (code === 50001 || code === 50013 || status === 403) {
    return `O Discord recusou a listagem de membros${code ? ` (código ${code})` : ""}. Confirme que o bot conectado pertence ao mesmo aplicativo em que Server Members Intent está ligado e reinicie o processo do Sentinel.`;
  }
  if (status === 401) {
    return "O Discord recusou a autenticação do bot. Confira o DISCORD_TOKEN e reinicie o Sentinel.";
  }
  if (code !== null || status !== null) {
    return `Não foi possível carregar os membros (Discord HTTP ${status ?? "?"}, código ${code ?? "?"}). Confira o log do backend para ver o erro completo.`;
  }
  return "Não foi possível carregar os membros. Confira o log do backend para ver o erro completo.";
}
