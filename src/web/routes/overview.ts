import { ChannelType, type NonThreadGuildBasedChannel } from "discord.js";
import { Router } from "express";
import type { GuildOverviewDTO } from "../../shared/dto.js";
import { requireGuildAccess } from "../middleware/requireGuildAccess.js";
import { withGuild } from "../http/guildContext.js";
import { sendRouteError } from "../http/errors.js";

export const overviewRouter = Router({ mergeParams: true });
overviewRouter.use(...requireGuildAccess);

overviewRouter.get("/", async (_req, res) => {
  try {
    await withGuild(res, async (guild) => {
      const channels = await guild.channels.fetch();
      const supported = [...channels.values()].filter(
        (channel): channel is NonThreadGuildBasedChannel => Boolean(channel),
      );
      const overview: GuildOverviewDTO = {
        memberCount: guild.memberCount,
        channelCount: supported.filter(
          (channel) => channel.type !== ChannelType.GuildCategory,
        ).length,
        categoryCount: supported.filter(
          (channel) => channel.type === ChannelType.GuildCategory,
        ).length,
        textChannelCount: supported.filter(
          (channel) =>
            channel.type === ChannelType.GuildText ||
            channel.type === ChannelType.GuildAnnouncement ||
            channel.type === ChannelType.GuildForum ||
            channel.type === ChannelType.GuildMedia,
        ).length,
        voiceChannelCount: supported.filter(
          (channel) =>
            channel.type === ChannelType.GuildVoice ||
            channel.type === ChannelType.GuildStageVoice,
        ).length,
      };
      res.json(overview);
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar a visão geral.",
      logMessage: "Falha ao carregar visão geral do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});
