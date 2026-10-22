import {
  ChannelType,
  type Guild,
  type GuildChannelTypes,
  type NonThreadGuildBasedChannel,
} from "discord.js";
import type {
  ChannelDTO,
  ChannelKind,
  ChannelTreeDTO,
  CreateChannelKind,
} from "../../shared/dto.js";
import { ModerationError } from "../../utils/permissions.js";

export const supportedChannelTypes = new Set<ChannelType>([
  ChannelType.GuildText,
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.GuildCategory,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
]);

export async function listChannels(guild: Guild): Promise<ChannelTreeDTO> {
  const channels = await guild.channels.fetch();
  const supported = [...channels.values()]
    .filter((channel): channel is NonThreadGuildBasedChannel =>
      Boolean(channel && supportedChannelTypes.has(channel.type)),
    )
    .sort((a, b) => a.position - b.position);
  const categories = supported.filter(
    (channel) => channel.type === ChannelType.GuildCategory,
  );
  return {
    categories: categories.map((category) =>
      channelToDto(
        category,
        supported
          .filter((channel) => channel.parentId === category.id)
          .map((channel) => channelToDto(channel)),
      ),
    ),
    uncategorized: supported
      .filter(
        (channel) =>
          channel.parentId === null &&
          channel.type !== ChannelType.GuildCategory,
      )
      .map((channel) => channelToDto(channel)),
  };
}

export function channelKind(type: ChannelType): ChannelKind {
  switch (type) {
    case ChannelType.GuildText:
      return "text";
    case ChannelType.GuildVoice:
      return "voice";
    case ChannelType.GuildStageVoice:
      return "stage";
    case ChannelType.GuildCategory:
      return "category";
    case ChannelType.GuildAnnouncement:
      return "announcement";
    case ChannelType.GuildForum:
      return "forum";
    case ChannelType.GuildMedia:
      return "media";
    default:
      throw new ModerationError(
        "Este tipo de canal ainda não é suportado pelo painel.",
      );
  }
}

export function channelToDto(
  channel: NonThreadGuildBasedChannel,
  children: ChannelDTO[] = [],
): ChannelDTO {
  return {
    id: channel.id,
    name: channel.name,
    type: channelKind(channel.type),
    position: channel.position,
    parentId: channel.parentId,
    topic:
      "topic" in channel && typeof channel.topic === "string"
        ? channel.topic
        : null,
    children,
  };
}

export function discordType(type: CreateChannelKind): GuildChannelTypes {
  switch (type) {
    case "text":
      return ChannelType.GuildText;
    case "voice":
      return ChannelType.GuildVoice;
    case "stage":
      return ChannelType.GuildStageVoice;
    case "category":
      return ChannelType.GuildCategory;
    case "announcement":
      return ChannelType.GuildAnnouncement;
    case "forum":
      return ChannelType.GuildForum;
  }
}
