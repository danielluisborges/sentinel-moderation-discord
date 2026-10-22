import type {
  Guild,
  GuildMember,
  PartialUser,
  TextChannel,
  User,
} from "discord.js";
import { prepareLogChannel } from "./logging/logChannel.js";
import {
  writeChannelAction,
  writeDiscordEvent,
  writeModerationAction,
} from "./logging/embeds.js";
import type { ChannelAction, ModerationLogEntry } from "./logging/embeds.js";

export type {
  ChannelAction,
  ModerationAction,
  ModerationLogEntry,
} from "./logging/embeds.js";

/** Stable logging facade for commands, events, and routes. */
export class LoggerService {
  async logDiscordEvent(
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
    await writeDiscordEvent(await this.prepareLogChannel(guild), guild, entry);
  }

  prepareLogChannel(guild: Guild): Promise<TextChannel> {
    return prepareLogChannel(guild);
  }

  logModerationAction(
    channel: TextChannel,
    guild: Guild,
    entry: ModerationLogEntry,
  ): Promise<void> {
    return writeModerationAction(channel, guild, entry);
  }

  logChannelAction(
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
    return writeChannelAction(channel, guild, entry);
  }
}

export const loggerService = new LoggerService();
