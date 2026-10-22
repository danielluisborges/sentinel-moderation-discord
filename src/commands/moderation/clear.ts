import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/command.js";
import { moderationService } from "../../services/moderation.service.js";
import { getModerationContext, replyPrivately } from "./shared.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Apaga até 100 mensagens recentes do canal.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("quantidade")
        .setDescription("Quantidade de mensagens entre 1 e 100.")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo da limpeza.")
        .setMaxLength(512),
    ),
  async execute(interaction) {
    const { guild, executor } = await getModerationContext(interaction);
    const channel = await guild.channels.fetch(interaction.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      await replyPrivately(
        interaction,
        "Use este comando em um canal de texto.",
      );
      return;
    }

    const amount = interaction.options.getInteger("quantidade", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const deletedCount = await moderationService.clear({
      guild,
      executor,
      channel,
      amount,
      ...(reason ? { reason } : {}),
      source: "command",
    });
    await replyPrivately(
      interaction,
      `${deletedCount} mensagem(ns) apagada(s).`,
    );
  },
};

export default command;
