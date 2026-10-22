import {
  ChannelType,
  Events,
  type GuildMember,
  type TextChannel,
} from "discord.js";
import { configService } from "../services/config.service.js";
import { loggerService } from "../services/logger.service.js";
import { renderMemberTemplate } from "./renderMemberTemplate.js";

export default {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember) {
    const config = await configService.getGuildConfig(member.guild.id);
    await loggerService.logDiscordEvent(member.guild, {
      title: "Membro saiu",
      executor: member.user,
      targetId: member.id,
      details: {
        Usuário: `${member.user.tag} (${member.id})`,
      },
    });

    if (!config.leaveEnabled || !config.leaveChannelId) return;
    const channel = await member.guild.channels.fetch(config.leaveChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;
    await sendAutomaticMessage(channel, config.leaveMessage, member);
  },
};

async function sendAutomaticMessage(
  channel: TextChannel,
  template: string,
  member: GuildMember,
): Promise<void> {
  const content = renderMemberTemplate(
    template,
    member,
    Math.max(0, member.guild.memberCount - 1),
  );
  await channel.send({
    content,
    allowedMentions: { users: [member.id] },
  });
}
