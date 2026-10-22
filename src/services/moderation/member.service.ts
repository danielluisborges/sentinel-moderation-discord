import { PermissionFlagsBits } from "discord.js";
import type { ConfigService } from "../config.service.js";
import type { LoggerService } from "../logger.service.js";
import { ModerationError } from "../../utils/permissions.js";
import {
  assertSnowflake,
  normalizeReason,
  prepareModerationAction,
  requireMember,
  type EditMemberAction,
} from "./shared.js";

export class ModerationMemberService {
  constructor(
    private readonly configs: ConfigService,
    private readonly logs: LoggerService,
  ) {}

  async editMember({
    guild,
    executor,
    targetId,
    nickname,
    roleIds,
    reason,
    source,
  }: EditMemberAction): Promise<void> {
    assertSnowflake(targetId);
    if (nickname && nickname.length > 32) {
      throw new ModerationError("O apelido pode ter no máximo 32 caracteres.");
    }
    if (new Set(roleIds).size !== roleIds.length) {
      throw new ModerationError("A lista de cargos contém itens repetidos.");
    }

    const target = await requireMember(guild, targetId);
    const logChannel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ManageRoles,
      target,
    );
    const botMember = guild.members.me ?? (await guild.members.fetchMe());
    const selectedRoles = roleIds.map((roleId) => {
      const role = guild.roles.cache.get(roleId);
      if (
        !role ||
        role.id === guild.id ||
        role.managed ||
        role.position >= botMember.roles.highest.position ||
        (executor.id !== guild.ownerId &&
          role.position >= executor.roles.highest.position)
      ) {
        throw new ModerationError(
          "Um dos cargos selecionados está acima da sua hierarquia ou da hierarquia do Sentinel.",
        );
      }
      return role;
    });

    const previousNickname = target.nickname;
    const previousRoleIds = target.roles.cache
      .filter((role) => role.id !== guild.id && !role.managed)
      .map((role) => role.id);
    const previousRoleSet = new Set(previousRoleIds);
    const selectedRoleSet = new Set(selectedRoles.map((role) => role.id));
    const addedRoles = selectedRoles
      .filter((role) => !previousRoleSet.has(role.id))
      .map((role) => `<@&${role.id}>`);
    const removedRoles = previousRoleIds
      .filter((roleId) => !selectedRoleSet.has(roleId))
      .map((roleId) => `<@&${roleId}>`);
    const nicknameChanged = (previousNickname ?? "") !== (nickname ?? "");
    const rolesChanged = addedRoles.length > 0 || removedRoles.length > 0;
    if (!nicknameChanged && !rolesChanged) return;

    const reasonText = normalizeReason(reason);
    const managedRoleIds = target.roles.cache
      .filter((role) => role.managed)
      .map((role) => role.id);
    await target.edit({
      nick: nickname,
      roles: [...managedRoleIds, ...selectedRoleSet],
      ...(reasonText ? { reason: reasonText } : {}),
    });

    await this.logs.logModerationAction(logChannel, guild, {
      action: "member_edit",
      executor,
      targetId,
      source,
      ...(reasonText ? { reason: reasonText } : {}),
      details: {
        ...(nicknameChanged
          ? {
              "Apelido anterior": previousNickname || "Padrão do Discord",
              "Novo apelido": nickname || "Padrão do Discord",
            }
          : {}),
        ...(addedRoles.length
          ? { "Cargos adicionados": addedRoles.join(", ") }
          : {}),
        ...(removedRoles.length
          ? { "Cargos removidos": removedRoles.join(", ") }
          : {}),
      },
    });
  }
}

export type { EditMemberAction } from "./shared.js";
