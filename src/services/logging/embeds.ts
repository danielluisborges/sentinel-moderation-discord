import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type PartialUser,
  type TextChannel,
  type User,
} from "discord.js";
import { logger } from "../../logger.js";
import { ModerationError } from "../../utils/permissions.js";

export type ModerationAction =
  | "ban"
  | "unban"
  | "kick"
  | "timeout"
  | "untimeout"
  | "warn"
  | "clear"
  | "member_edit"
  | "role_create"
  | "role_delete";
export type ChannelAction =
  "created" | "category_created" | "updated" | "deleted" | "reordered";

export interface ModerationLogEntry {
  action: ModerationAction;
  executor: GuildMember;
  source: "command" | "panel";
  targetId?: string;
  reason?: string;
  details?: Record<string, string>;
}

const actionTitles: Record<ModerationAction, string> = {
  ban: "Membro banido",
  unban: "Banimento removido",
  kick: "Membro expulso",
  timeout: "Timeout aplicado",
  untimeout: "Timeout removido",
  member_edit: "Membro editado",
  role_create: "Cargo criado",
  role_delete: "Cargo apagado",
  warn: "Aviso aplicado",
  clear: "Mensagens apagadas",
};
const channelActionTitles: Record<ChannelAction, string> = {
  created: "Canal criado",
  category_created: "Categoria criada",
  updated: "Canal editado",
  deleted: "Canal apagado",
  reordered: "Canais reorganizados",
};

export async function writeDiscordEvent(
  channel: TextChannel,
  guild: Guild,
  entry: {
    title: string;
    executor: User | PartialUser | null;
    source?: "discord" | "panel";
    targetId?: string;
    channelId?: string;
    imageUrl?: string;
    details: Record<string, string>;
    reason?: string | null;
  },
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(limit(entry.title, 256))
    .addFields(
      {
        name:
          entry.title === "Membro entrou"
            ? "Membro que entrou"
            : entry.title === "Membro saiu"
              ? "Membro que saiu"
              : "Quem fez a ação",
        value: entry.executor
          ? `${entry.executor} (\`${entry.executor.id}\`)`
          : "Não identificado pelo Audit Log do Discord",
        inline: true,
      },
      {
        name: "Origem",
        value:
          entry.source === "panel"
            ? "Painel"
            : entry.executor?.id === guild.client.user?.id
              ? "Painel / Sentinel"
              : "Discord",
        inline: true,
      },
    )
    .setFooter({ text: `${guild.name} • ${guild.id}` })
    .setTimestamp(new Date());

  if (entry.title === "Membro entrou" || entry.title === "Membro saiu") {
    embed.setAuthor({
      name: entry.title,
      ...(entry.executor
        ? {
            iconURL: entry.executor.displayAvatarURL({
              extension: "png",
              size: 128,
            }),
          }
        : {}),
    });
  } else if (entry.executor) {
    embed.setAuthor({
      name: `Ação feita por ${entry.executor.tag}`,
      iconURL: entry.executor.displayAvatarURL({ extension: "png", size: 128 }),
    });
  } else embed.setAuthor({ name: "Ação feita por pessoa não identificada" });

  const targetAvatar = await resolveAvatar(guild, entry.targetId);
  if (targetAvatar) embed.setThumbnail(targetAvatar);
  if (entry.imageUrl) embed.setImage(entry.imageUrl);
  if (entry.reason?.trim())
    embed.addFields({
      name: "Motivo",
      value: limit(entry.reason.trim(), 1024),
      inline: false,
    });
  if (entry.targetId)
    embed.addFields({
      name:
        entry.title === "Mensagem apagada"
          ? "Autor da mensagem"
          : entry.title === "Membro entrou" || entry.title === "Membro saiu"
            ? "Membro"
            : "Pessoa afetada",
      value: `<@${entry.targetId}> (\`${entry.targetId}\`)`,
      inline: true,
    });
  if (entry.channelId)
    embed.addFields({
      name: "Canal",
      value: `<#${entry.channelId}> (\`${entry.channelId}\`)`,
      inline: true,
    });
  for (const [name, value] of Object.entries(entry.details))
    embed.addFields({ name: limit(name, 256), value: limit(value, 1024) });
  try {
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    logger.error(
      { err: error, guildId: guild.id },
      "Falha ao registrar evento do Discord",
    );
    throw new ModerationError(
      "O evento ocorreu, mas o Sentinel não conseguiu registrá-lo no canal privado de logs.",
    );
  }
}

export async function writeModerationAction(
  channel: TextChannel,
  guild: Guild,
  entry: ModerationLogEntry,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(
      entry.action === "warn"
        ? 0xf59e0b
        : entry.action === "member_edit" ||
            entry.action === "role_create" ||
            entry.action === "role_delete"
          ? 0x3b82f6
          : 0xef4444,
    )
    .setTitle(actionTitles[entry.action])
    .addFields(
      {
        name: "Quem fez a ação",
        value: `${entry.executor} (\`${entry.executor.id}\`)`,
        inline: true,
      },
      {
        name: "Origem",
        value: entry.source === "panel" ? "Painel" : "Comando",
        inline: true,
      },
      {
        name: "Motivo",
        value: limit(entry.reason?.trim() || "Não informado", 1024),
        inline: false,
      },
    )
    .setFooter({ text: `${guild.name} • ${guild.id}` })
    .setTimestamp(new Date());
  embed.setAuthor({
    name: `Ação feita por ${entry.executor.user.tag}`,
    iconURL: entry.executor.displayAvatarURL({ extension: "png", size: 128 }),
  });
  const targetAvatar = await resolveAvatar(guild, entry.targetId);
  if (targetAvatar) embed.setThumbnail(targetAvatar);
  if (entry.targetId)
    embed.addFields({
      name: "Pessoa afetada",
      value: `<@${entry.targetId}> (\`${entry.targetId}\`)`,
      inline: true,
    });
  for (const [name, value] of Object.entries(entry.details ?? {}))
    embed.addFields({
      name: limit(name, 256),
      value: limit(value, 1024),
      ...(entry.action === "role_delete" ? { inline: true } : {}),
    });
  try {
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    logger.error(
      { err: error, guildId: guild.id, action: entry.action },
      "Falha ao gravar log privado de moderação",
    );
    throw new ModerationError(
      "A ação foi aplicada, mas não foi possível gravar o log no canal privado.",
    );
  }
}

export async function writeChannelAction(
  channel: TextChannel,
  guild: Guild,
  entry: {
    action: ChannelAction;
    executor: GuildMember;
    channelName?: string;
    categoryName?: string;
    details?: Record<string, string>;
  },
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x3b82f6)
    .setTitle(channelActionTitles[entry.action])
    .addFields(
      {
        name: "Quem fez a ação",
        value: `${entry.executor} (\`${entry.executor.id}\`)`,
        inline: true,
      },
      { name: "Origem", value: "Painel", inline: true },
    )
    .setFooter({ text: `${guild.name} • ${guild.id}` })
    .setTimestamp(new Date());
  embed.setAuthor({
    name: `Ação feita por ${entry.executor.user.tag}`,
    iconURL: entry.executor.displayAvatarURL({ extension: "png", size: 128 }),
  });
  if (entry.channelName)
    embed.addFields({ name: "Canal", value: limit(entry.channelName, 256) });
  if (entry.categoryName)
    embed.addFields({
      name: "Categoria",
      value: limit(entry.categoryName, 256),
    });
  for (const [name, value] of Object.entries(entry.details ?? {}))
    embed.addFields({ name: limit(name, 256), value: limit(value, 1024) });
  try {
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    logger.error(
      { err: error, guildId: guild.id, action: entry.action },
      "Falha ao gravar log privado de canal",
    );
    throw new ModerationError(
      "A ação foi aplicada, mas não foi possível gravar o log no canal privado.",
    );
  }
}

function limit(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

async function resolveAvatar(
  guild: Guild,
  targetId: string | undefined,
): Promise<string | undefined> {
  if (!targetId) return undefined;
  const cached = guild.client.users.cache.get(targetId);
  if (cached) return cached.displayAvatarURL({ extension: "png", size: 256 });
  try {
    return (await guild.client.users.fetch(targetId)).displayAvatarURL({
      extension: "png",
      size: 256,
    });
  } catch {
    return undefined;
  }
}
