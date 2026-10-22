import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { moderationService } from "../../services/moderation.service.js";
import { getModerationContext, replyPrivately } from "./shared.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Registra um aviso para um membro.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro avisado.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo do aviso.")
        .setRequired(true)
        .setMaxLength(512),
    ),
  async execute(interaction) {
    const { guild, executor } = await getModerationContext(interaction);
    const target = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo", true);
    const warningCount = await moderationService.warn({
      guild,
      executor,
      targetId: target.id,
      reason,
      source: "command",
    });
    await replyPrivately(
      interaction,
      `${target.tag} recebeu um aviso. Total registrado: ${warningCount}.`,
    );
  },
};

export default command;
