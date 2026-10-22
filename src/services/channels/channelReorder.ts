import {
  ChannelType,
  type Guild,
  type GuildMember,
  type NonThreadGuildBasedChannel,
  type TextChannel,
} from "discord.js";
import type { ChannelPositionUpdate } from "../../shared/dto.js";
import { ModerationError } from "../../utils/permissions.js";
import type { LoggerService } from "../logger.service.js";
import { supportedChannelTypes } from "./channelTree.js";

export async function reorderChannels(
  guild: Guild,
  executor: GuildMember,
  updates: ChannelPositionUpdate[],
  logChannel: TextChannel,
  logs: LoggerService,
): Promise<void> {
  if (updates.length === 0) return;
  if (new Set(updates.map((entry) => entry.id)).size !== updates.length) {
    throw new ModerationError("A lista de canais contém IDs repetidos.");
  }

  const channels = await Promise.all(
    updates.map((entry) => resolveChannel(guild, entry.id)),
  );
  const byId = new Map(channels.map((channel) => [channel.id, channel]));
  for (const update of updates) {
    if (update.parentId !== null && update.parentId !== undefined) {
      const parent = await resolveChannel(guild, update.parentId);
      if (parent.type !== ChannelType.GuildCategory) {
        throw new ModerationError("A categoria selecionada não é válida.");
      }
    }
    if (
      byId.get(update.id)?.type === ChannelType.GuildCategory &&
      update.parentId !== null
    ) {
      throw new ModerationError(
        "Categorias não podem ficar dentro de outra categoria.",
      );
    }
  }

  const moved = updates.filter(
    (entry) => byId.get(entry.id)?.parentId !== (entry.parentId ?? null),
  );
  // Discord permits changing only one channel's category parent per bulk request.
  // Keep each parent change focused, then apply every final position in one batch.
  for (const entry of moved) {
    await guild.channels.setPositions([
      {
        channel: entry.id,
        position: entry.position,
        parent: entry.parentId,
      },
    ]);
  }
  await guild.channels.setPositions(
    updates.map((entry) => ({ channel: entry.id, position: entry.position })),
  );
  await logs.logChannelAction(logChannel, guild, {
    action: "reordered",
    executor,
    details: {
      "Canais reorganizados": String(updates.length),
      "Categorias alteradas": String(moved.length),
    },
  });
}

async function resolveChannel(guild: Guild, id: string) {
  const channel = await guild.channels.fetch(id);
  if (!channel || !supportedChannelTypes.has(channel.type)) {
    throw new ModerationError(
      "Canal não encontrado neste servidor ou tipo não suportado.",
    );
  }
  return channel as NonThreadGuildBasedChannel;
}
