import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type TextChannel,
} from "discord.js";
import { configService } from "../config.service.js";
import { ModerationError } from "../../utils/permissions.js";

export async function prepareLogChannel(guild: Guild): Promise<TextChannel> {
  const config = await configService.getGuildConfig(guild.id);
  if (!config.logChannelId) {
    const botMember = guild.members.me ?? (await guild.members.fetchMe());
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new ModerationError(
        "O Sentinel precisa da permissão Gerenciar Canais para criar seu canal privado de logs.",
      );
    }
    const channel = await guild.channels.create({
      name: "sentinel-logs",
      type: ChannelType.GuildText,
      topic: "Registros privados de moderação e administração do Sentinel.",
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: botMember.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
      reason: "Configuração automática do canal privado de logs do Sentinel",
    });
    await configService.setLogChannel(guild.id, channel.id);
    return channel;
  }

  const channel = await guild.channels.fetch(config.logChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new ModerationError(
      "O canal de logs configurado não existe ou não é um canal de texto.",
    );
  }
  if (
    channel
      .permissionsFor(guild.roles.everyone)
      .has(PermissionFlagsBits.ViewChannel)
  ) {
    throw new ModerationError(
      "O canal de logs precisa continuar privado para @everyone.",
    );
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe());
  const botPermissions = channel.permissionsFor(botMember);
  if (
    !botPermissions.has([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
    ])
  ) {
    throw new ModerationError(
      "O Sentinel precisa de Ver canal, Enviar mensagens e Incorporar links no canal de logs.",
    );
  }
  return channel;
}
