import { AuditLogEvent, Events, type GuildMember } from "discord.js";
import { loggerService } from "../services/logger.service.js";

const auditLookbackMs = 15_000;

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    const oldRoles = new Set(
      oldMember.roles.cache
        .filter((role) => role.id !== oldMember.guild.id)
        .map((role) => role.id),
    );
    const newRoles = new Set(
      newMember.roles.cache
        .filter((role) => role.id !== newMember.guild.id)
        .map((role) => role.id),
    );
    const added = [...newRoles].filter((id) => !oldRoles.has(id));
    const removed = [...oldRoles].filter((id) => !newRoles.has(id));
    const nicknameChanged = oldMember.nickname !== newMember.nickname;
    if (added.length === 0 && removed.length === 0 && !nicknameChanged) return;

    await new Promise((resolve) => setTimeout(resolve, 700));
    let executor = null;
    let reason: string | null = null;
    try {
      const logs = await newMember.guild.fetchAuditLogs({
        type:
          added.length || removed.length
            ? AuditLogEvent.MemberRoleUpdate
            : AuditLogEvent.MemberUpdate,
        limit: 10,
      });
      const entry = logs.entries.find(
        (candidate) =>
          candidate.target?.id === newMember.id &&
          Date.now() - candidate.createdTimestamp <= auditLookbackMs,
      );
      executor = entry?.executor ?? null;
      reason = entry?.reason ?? null;
    } catch {
      // Role changes are still recorded even if View Audit Log is unavailable.
    }

    // The panel already records its own edits with the authenticated admin as executor.
    if (executor?.id === newMember.client.user?.id) return;

    const roleNames = (ids: string[]) =>
      ids.map((id) => {
        const role = newMember.guild.roles.cache.get(id);
        return role ? `${role.name} (${id})` : id;
      });
    await loggerService.logDiscordEvent(newMember.guild, {
      title:
        added.length || removed.length
          ? "Cargos do membro alterados"
          : "Apelido do membro alterado",
      executor,
      targetId: newMember.id,
      reason,
      details: {
        ...(added.length
          ? { "Cargos adicionados": roleNames(added).join(", ") }
          : {}),
        ...(removed.length
          ? { "Cargos removidos": roleNames(removed).join(", ") }
          : {}),
        ...(nicknameChanged
          ? {
              "Apelido anterior": oldMember.nickname || "Padrão do Discord",
              "Novo apelido": newMember.nickname || "Padrão do Discord",
            }
          : {}),
      },
    });
  },
};
