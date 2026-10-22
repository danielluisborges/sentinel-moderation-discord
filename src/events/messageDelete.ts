import {
  AuditLogEvent,
  Events,
  PermissionFlagsBits,
  type Message,
  type PartialUser,
  type User,
} from "discord.js";
import { loggerService } from "../services/logger.service.js";
import { takeMessageSnapshot } from "./messageSnapshotCache.js";

const auditLookbackMs = 15_000;
const contentLimit = 900;

export default {
  name: Events.MessageDelete,
  async execute(message: Message) {
    const guild = message.guild;
    if (!guild) return;

    const snapshot = takeMessageSnapshot(message.id);

    await new Promise((resolve) => setTimeout(resolve, 700));
    let executor: User | PartialUser | null = null;
    let reason: string | null = null;
    try {
      const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 10,
      });
      const entry = logs.entries.find((candidate) => {
        const extra = candidate.extra as { channel?: { id?: string } } | null;
        return (
          candidate.target?.id === (message.author?.id ?? snapshot?.authorId) &&
          extra?.channel?.id === message.channelId &&
          Date.now() - candidate.createdTimestamp <= auditLookbackMs
        );
      });
      executor = entry?.executor ?? null;
      reason = entry?.reason ?? null;
    } catch {
      // Content and target are still logged if the bot cannot inspect the audit log.
    }

    const rawContent = message.content.trim() || snapshot?.content.trim() || "";
    const content = rawContent
      ? rawContent.slice(0, contentLimit) +
        (rawContent.length > contentLimit ? "…" : "")
      : message.partial && !snapshot
        ? "Conteúdo indisponível: o Sentinel não recebeu o conteúdo antes da exclusão."
        : "Mensagem sem texto.";
    const attachments = snapshot?.attachments.length
      ? snapshot.attachments
      : [...message.attachments.values()].map((attachment) => ({
          name: attachment.name,
          url: attachment.url,
          isImage:
            attachment.contentType?.startsWith("image/") === true ||
            /\.(png|jpe?g|gif|webp|avif)$/i.test(attachment.name),
        }));
    const preview = attachments.find((attachment) => attachment.isImage);
    const otherAttachments = attachments.filter(
      (attachment) => attachment !== preview,
    );
    const details: Record<string, string> = {
      Mensagem: content,
      ...(preview
        ? { "Prévia da imagem": `${preview.name} (imagem exibida abaixo)` }
        : {}),
      ...(otherAttachments.length
        ? {
            Anexos: otherAttachments
              .map((attachment) => `${attachment.name}: ${attachment.url}`)
              .join("\n")
              .slice(0, 900),
          }
        : {}),
    };

    if (!executor) {
      const canViewAuditLog =
        guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog) ??
        false;
      details["Por que não identificou quem apagou"] = canViewAuditLog
        ? "O Discord não retornou uma entrada correspondente no Audit Log. Quando a própria pessoa apaga sua mensagem, o Discord não informa um moderador como executor."
        : "O Sentinel está sem a permissão Ver registro de auditoria. Conceda essa permissão para identificar moderadores que apagam mensagens.";
    }

    await loggerService.logDiscordEvent(guild, {
      title: "Mensagem apagada",
      executor,
      ...((message.author?.id ?? snapshot?.authorId)
        ? { targetId: message.author?.id ?? snapshot?.authorId }
        : {}),
      channelId: message.channelId,
      ...(preview ? { imageUrl: preview.url } : {}),
      reason,
      details,
    });
  },
};
