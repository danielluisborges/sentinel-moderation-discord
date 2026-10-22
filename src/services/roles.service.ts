import { PermissionFlagsBits, type Guild, type GuildMember } from "discord.js";
import type { RoleDetailsDTO } from "../shared/dto.js";
import {
  rolePermissionLabels,
  type RolePermission,
} from "../shared/rolePermissions.js";
import { moderationService } from "./moderation.service.js";
import { fetchMembersWithRole } from "../utils/membersWithRole.js";
import { HttpError } from "../web/http/errors.js";

const rolePermissionBits = {
  ManageMessages: PermissionFlagsBits.ManageMessages,
  KickMembers: PermissionFlagsBits.KickMembers,
  BanMembers: PermissionFlagsBits.BanMembers,
  ModerateMembers: PermissionFlagsBits.ModerateMembers,
  ManageChannels: PermissionFlagsBits.ManageChannels,
  ManageRoles: PermissionFlagsBits.ManageRoles,
} satisfies Record<RolePermission, bigint>;

export interface CreateRoleInput {
  name: string;
  color: string;
  hoist: boolean;
  mentionable: boolean;
  permissions: RolePermission[];
  reason?: string;
}

export class RolesService {
  async details(guild: Guild, roleId: string): Promise<RoleDetailsDTO> {
    const role = await guild.roles.fetch(roleId);
    if (!role || role.id === guild.id || role.managed) {
      throw new HttpError(404, "Cargo não encontrado ou não gerenciável.");
    }
    const members = await fetchMembersWithRole(guild, role.id);
    return {
      id: role.id,
      name: role.name,
      color: role.hexColor,
      memberCount: members.length,
      members: members
        .map((member) => ({
          id: member.id,
          name: member.displayName,
          username: member.user.username,
          avatarUrl: member.user.displayAvatarURL({ size: 128 }),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    };
  }

  create(guild: Guild, executor: GuildMember, input: CreateRoleInput) {
    return moderationService.createRole({
      guild,
      executor,
      name: input.name,
      color: Number.parseInt(input.color.slice(1), 16),
      hoist: input.hoist,
      mentionable: input.mentionable,
      permissions: input.permissions.map(
        (permission) => rolePermissionBits[permission],
      ),
      permissionLabels: input.permissions.map(
        (permission) => rolePermissionLabels[permission],
      ),
      ...(input.reason ? { reason: input.reason } : {}),
      source: "panel",
    });
  }

  async revoke(
    guild: Guild,
    executor: GuildMember,
    roleId: string,
    userId: string,
  ): Promise<void> {
    const [role, member] = await Promise.all([
      guild.roles.fetch(roleId),
      guild.members.fetch(userId),
    ]);
    if (!role || !member.roles.cache.has(role.id)) {
      throw new HttpError(404, "O membro não possui mais esse cargo.");
    }
    const roleIds = member.roles.cache
      .filter(
        (candidate) =>
          candidate.id !== guild.id &&
          !candidate.managed &&
          candidate.id !== role.id,
      )
      .map((candidate) => candidate.id);
    await moderationService.editMember({
      guild,
      executor,
      targetId: member.id,
      nickname: member.nickname,
      roleIds,
      reason: `Cargo revogado pelo painel: ${role.name}`,
      source: "panel",
    });
  }

  async delete(
    guild: Guild,
    executor: GuildMember,
    roleId: string,
    reason?: string,
  ): Promise<void> {
    const role = await guild.roles.fetch(roleId);
    if (!role) throw new HttpError(404, "Cargo não encontrado.");
    const memberCount = (await fetchMembersWithRole(guild, role.id)).length;
    await moderationService.deleteRole({
      guild,
      executor,
      role,
      memberCount,
      source: "panel",
      ...(reason !== undefined ? { reason } : {}),
    });
  }
}

export const rolesService = new RolesService();
