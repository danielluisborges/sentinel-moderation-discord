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
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const config = await configService.getGuildConfig(member.guild.id);
    await loggerService.logDiscordEvent(member.guild, {
      title: "Membro entrou",
      executor: member.user,
      targetId: member.id,
      details: {
        Usuário: `${member.user.tag} (${member.id})`,
        "Conta criada": `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
      },
    });

    if (!config.welcomeEnabled || !config.welcomeChannelId) return;
    const channel = await member.guild.channels.fetch(config.welcomeChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) return;
    await sendAutomaticMessage(channel, config.welcomeMessage, member);
  },
};

async function sendAutomaticMessage(
  channel: TextChannel,
  template: string,
  member: GuildMember,
): Promise<void> {
  const content = renderMemberTemplate(template, member);
  await channel.send({
    content,
    allowedMentions: { users: [member.id] },
  });
}
