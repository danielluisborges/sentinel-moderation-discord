import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { moderationService } from "../../services/moderation.service.js";
import { getModerationContext, replyPrivately } from "./shared.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um usuário deste servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("id-usuario")
        .setDescription("ID do usuário, inclusive se ele já saiu do servidor.")
        .setRequired(true)
        .setMinLength(15)
        .setMaxLength(22),
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo do banimento.")
        .setMaxLength(512),
    ),
  async execute(interaction) {
    const { guild, executor } = await getModerationContext(interaction);
    const targetId = interaction.options.getString("id-usuario", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    await moderationService.ban({
      guild,
      executor,
      targetId,
      ...(reason ? { reason } : {}),
      source: "command",
    });
    await replyPrivately(interaction, `O usuário ${targetId} foi banido.`);
  },
};

export default command;
