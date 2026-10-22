import { PermissionFlagsBits, type Role } from "discord.js";
import type { ConfigService } from "../config.service.js";
import type { LoggerService } from "../logger.service.js";
import { ModerationError } from "../../utils/permissions.js";
import {
  normalizeReason,
  prepareModerationAction,
  type CreateRoleAction,
  type DeleteRoleAction,
} from "./shared.js";

export class ModerationRoleService {
  constructor(
    private readonly configs: ConfigService,
    private readonly logs: LoggerService,
  ) {}

  async createRole({
    guild,
    executor,
    name,
    color,
    hoist,
    mentionable,
    permissions,
    permissionLabels,
    reason,
    source,
  }: CreateRoleAction): Promise<Role> {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 100) {
      throw new ModerationError(
        "O nome do cargo deve ter de 1 a 100 caracteres.",
      );
    }
    const normalizedReason = normalizeReason(reason);
    const logChannel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ManageRoles,
    );
    const role = await guild.roles.create({
      name: normalizedName,
      color,
      hoist,
      mentionable,
      permissions,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
    await this.logs.logModerationAction(logChannel, guild, {
      action: "role_create",
      executor,
      source,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      details: {
        Cargo: `${role} (${role.id})`,
        Cor: `#${role.color.toString(16).padStart(6, "0")}`,
        "Exibir separado": hoist ? "Sim" : "Não",
        Mencionável: mentionable ? "Sim" : "Não",
        Permissões:
          permissionLabels.length > 0
            ? permissionLabels.join(", ")
            : "Nenhuma permissão especial",
      },
    });
    return role;
  }

  async deleteRole({
    guild,
    executor,
    role,
    memberCount,
    reason,
    source,
  }: DeleteRoleAction): Promise<void> {
    if (role.id === guild.id || role.managed) {
      throw new ModerationError("Esse cargo não pode ser apagado pelo painel.");
    }
    const logChannel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ManageRoles,
    );
    const botMember = guild.members.me ?? (await guild.members.fetchMe());
    if (
      role.position >= botMember.roles.highest.position ||
      (executor.id !== guild.ownerId &&
        role.position >= executor.roles.highest.position)
    ) {
      throw new ModerationError(
        "Esse cargo está acima da hierarquia sua ou do Sentinel.",
      );
    }

    const normalizedReason = normalizeReason(reason);
    await role.delete(normalizedReason ?? undefined);
    if ((await this.configs.getGuildConfig(guild.id)).modRoleId === role.id) {
      await this.configs.setModRole(guild.id, null);
    }
    await this.logs.logModerationAction(logChannel, guild, {
      action: "role_delete",
      executor,
      source,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      details: {
        Cargo: `${role.name} (${role.id})`,
        "Membros afetados": String(memberCount),
      },
    });
  }
}

export type { CreateRoleAction, DeleteRoleAction } from "./shared.js";
