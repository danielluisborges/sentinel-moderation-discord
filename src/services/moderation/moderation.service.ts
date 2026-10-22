import { PermissionFlagsBits } from "discord.js";
import type { ConfigService } from "../config.service.js";
import type { LoggerService } from "../logger.service.js";
import {
  assertSnowflake,
  findMemberIfPresent,
  formatDuration,
  isValidTimeoutDuration,
  normalizeReason,
  prepareModerationAction,
  requireMember,
  type ClearAction,
  type TargetAction,
} from "./shared.js";
import { ModerationError } from "../../utils/permissions.js";

export class ModerationActionsService {
  constructor(
    private readonly configs: ConfigService,
    private readonly logs: LoggerService,
  ) {}

  async ban({
    guild,
    executor,
    targetId,
    reason,
    source,
  }: TargetAction): Promise<void> {
    assertSnowflake(targetId);
    const target = await findMemberIfPresent(guild, targetId);
    const normalizedReason = normalizeReason(reason);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.BanMembers,
      target ?? undefined,
    );
    await guild.members.ban(targetId, {
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
    await this.logs.logModerationAction(channel, guild, {
      action: "ban",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
  }

  async unban({
    guild,
    executor,
    targetId,
    reason,
    source,
  }: TargetAction): Promise<void> {
    assertSnowflake(targetId);
    const normalizedReason = normalizeReason(reason);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.BanMembers,
    );
    if (normalizedReason) await guild.members.unban(targetId, normalizedReason);
    else await guild.members.unban(targetId);
    await this.logs.logModerationAction(channel, guild, {
      action: "unban",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
  }

  async kick({
    guild,
    executor,
    targetId,
    reason,
    source,
  }: TargetAction): Promise<void> {
    assertSnowflake(targetId);
    const normalizedReason = normalizeReason(reason);
    const target = await requireMember(guild, targetId);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.KickMembers,
      target,
    );
    if (normalizedReason) await target.kick(normalizedReason);
    else await target.kick();
    await this.logs.logModerationAction(channel, guild, {
      action: "kick",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
  }

  async timeout(input: TargetAction & { durationMs: number }): Promise<void> {
    const { guild, executor, targetId, reason, source, durationMs } = input;
    assertSnowflake(targetId);
    const normalizedReason = normalizeReason(reason);
    if (!isValidTimeoutDuration(durationMs)) {
      throw new ModerationError(
        "O timeout precisa estar entre 1 minuto e 28 dias.",
      );
    }
    const target = await requireMember(guild, targetId);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ModerateMembers,
      target,
    );
    if (normalizedReason) await target.timeout(durationMs, normalizedReason);
    else await target.timeout(durationMs);
    await this.logs.logModerationAction(channel, guild, {
      action: "timeout",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      details: { Duração: formatDuration(durationMs) },
    });
  }

  async removeTimeout({
    guild,
    executor,
    targetId,
    reason,
    source,
  }: TargetAction): Promise<void> {
    assertSnowflake(targetId);
    const normalizedReason = normalizeReason(reason);
    const target = await requireMember(guild, targetId);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ModerateMembers,
      target,
    );
    if (normalizedReason) await target.timeout(null, normalizedReason);
    else await target.timeout(null);
    await this.logs.logModerationAction(channel, guild, {
      action: "untimeout",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
    });
  }

  async warn({
    guild,
    executor,
    targetId,
    reason,
    source,
  }: TargetAction): Promise<number> {
    assertSnowflake(targetId);
    const normalizedReason = normalizeReason(reason);
    const target = await requireMember(guild, targetId);
    const channel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ModerateMembers,
      target,
    );
    const warningCount = await this.configs.addWarning(guild.id, targetId);
    await this.logs.logModerationAction(channel, guild, {
      action: "warn",
      executor,
      source,
      targetId,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      details: { "Total de avisos": String(warningCount) },
    });
    return warningCount;
  }

  async clear({
    guild,
    executor,
    channel,
    amount,
    reason,
    source,
  }: ClearAction): Promise<number> {
    if (channel.guildId !== guild.id) {
      throw new ModerationError("O canal precisa pertencer a este servidor.");
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      throw new ModerationError("A quantidade precisa estar entre 1 e 100.");
    }
    const normalizedReason = normalizeReason(reason);
    const logChannel = await prepareModerationAction(
      this.configs,
      this.logs,
      guild,
      executor,
      PermissionFlagsBits.ManageMessages,
    );
    const deleted = await channel.bulkDelete(amount, true);
    const deletedMessages = [...deleted.values()].map((message) => {
      if (!message) return "Mensagem indisponível no cache.";
      const author = message.author
        ? `${message.author.tag} (${message.author.id})`
        : "Autor indisponível";
      const content = message.content?.trim() || "[sem texto]";
      const attachmentUrls = [...message.attachments.values()]
        .map((attachment) => attachment.url)
        .join(", ");
      return `${author}: ${content}${attachmentUrls ? ` | Anexos: ${attachmentUrls}` : ""}`;
    });
    const messageDetails = deletedMessages.join("\n");
    await this.logs.logModerationAction(logChannel, guild, {
      action: "clear",
      executor,
      source,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      details: {
        Canal: `<#${channel.id}>`,
        "Mensagens apagadas": String(deleted.size),
        "Conteúdo das mensagens": messageDetails
          ? messageDetails.slice(0, 1000) +
            (messageDetails.length > 1000 ? "…" : "")
          : "O Discord não retornou o conteúdo das mensagens apagadas.",
      },
    });
    return deleted.size;
  }
}
