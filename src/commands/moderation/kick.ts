import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { moderationService } from "../../services/moderation.service.js";
import { getModerationContext, replyPrivately } from "./shared.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um membro do servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro a expulsar.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo da expulsão.")
        .setMaxLength(512),
    ),
  async execute(interaction) {
    const { guild, executor } = await getModerationContext(interaction);
    const target = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    await moderationService.kick({
      guild,
      executor,
      targetId: target.id,
      ...(reason ? { reason } : {}),
      source: "command",
    });
    await replyPrivately(interaction, `${target.tag} foi expulso do servidor.`);
  },
};

export default command;
