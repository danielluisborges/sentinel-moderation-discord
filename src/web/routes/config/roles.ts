import { Router } from "express";
import { z } from "zod";
import {
  rolePermissionOptions,
  type RolePermission,
} from "../../../shared/rolePermissions.js";
import { rolesService } from "../../../services/roles.service.js";
import { withGuild, withGuildExecutor } from "../../http/guildContext.js";
import { HttpError, sendRouteError } from "../../http/errors.js";
import { snowflakeSchema } from "../../http/schemas.js";

export const rolesRouter = Router({ mergeParams: true });
const rolePermissionSchema = z.custom<RolePermission>((value) =>
  rolePermissionOptions.some((permission) => permission.value === value),
);
const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hoist: z.boolean(),
  mentionable: z.boolean(),
  permissions: z.array(rolePermissionSchema).max(6),
  reason: z.string().trim().max(512).optional(),
});

rolesRouter.post("/", async (req, res) => {
  const parsed = createRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Confira o nome, a cor e as permissões do cargo." });
    return;
  }
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      const { reason, ...input } = parsed.data;
      const role = await rolesService.create(guild, executor, {
        ...input,
        ...(reason ? { reason } : {}),
      });
      res.status(201).json({ id: role.id, name: role.name });
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu criar esse cargo.",
      logMessage: "Falha ao criar cargo pelo painel",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

rolesRouter.get("/:roleId", async (req, res) => {
  const roleId = snowflakeSchema.safeParse(req.params.roleId);
  if (!roleId.success) {
    res.status(400).json({ error: "ID de cargo inválido." });
    return;
  }
  try {
    await withGuild(res, async (guild) => {
      res.json(await rolesService.details(guild, roleId.data));
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar os membros com esse cargo.",
      logMessage: "Falha ao carregar membros por cargo",
      context: { guildId: String(res.locals.guildId), roleId: roleId.data },
    });
  }
});

rolesRouter.delete("/:roleId/members/:userId", async (req, res) => {
  const roleId = snowflakeSchema.safeParse(req.params.roleId);
  const userId = snowflakeSchema.safeParse(req.params.userId);
  if (!roleId.success || !userId.success) {
    res.status(400).json({ error: "ID de cargo ou membro inválido." });
    return;
  }
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      await rolesService.revoke(guild, executor, roleId.data, userId.data);
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "O Sentinel não conseguiu revogar esse cargo.",
      logMessage: "Falha ao revogar cargo pelo painel",
      context: {
        guildId: String(res.locals.guildId),
        roleId: roleId.data,
        userId: userId.data,
      },
    });
  }
});

rolesRouter.delete("/:roleId", async (req, res) => {
  const roleId = snowflakeSchema.safeParse(req.params.roleId);
  if (!roleId.success) {
    res.status(400).json({ error: "ID de cargo inválido." });
    return;
  }
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      const reason =
        typeof req.body?.reason === "string" ? req.body.reason : undefined;
      await rolesService.delete(guild, executor, roleId.data, reason);
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: (caught) => describeRoleDeleteError(caught),
      logMessage: "Falha ao apagar cargo pelo painel",
      context: { guildId: String(res.locals.guildId), roleId: roleId.data },
    });
  }
});

function describeRoleDeleteError(error: unknown): string {
  if (error instanceof HttpError) return error.message;
  const details =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; status?: unknown })
      : {};
  if (details.code === 50013 || details.status === 403) {
    return "O Discord recusou a exclusão. Dê ao Sentinel a permissão Gerenciar cargos e mova o cargo dele para cima do cargo que você quer apagar.";
  }
  if (details.code === 10011) {
    return "Esse cargo já não existe no servidor. Atualize a página e tente novamente.";
  }
  return "Não foi possível apagar o cargo. Confira o log do backend para ver o erro detalhado.";
}
