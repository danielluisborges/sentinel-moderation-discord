import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { moderationService } from "../../services/moderation.service.js";
import { getModerationContext, replyPrivately } from "./shared.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Aplica um timeout em um membro.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro a silenciar.")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutos")
        .setDescription("Duração entre 1 minuto e 28 dias.")
        .setMinValue(1)
        .setMaxValue(40_320)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo do timeout.")
        .setMaxLength(512),
    ),
  async execute(interaction) {
    const { guild, executor } = await getModerationContext(interaction);
    const target = interaction.options.getUser("usuario", true);
    const minutes = interaction.options.getInteger("minutos", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    await moderationService.timeout({
      guild,
      executor,
      targetId: target.id,
      durationMs: minutes * 60_000,
      ...(reason ? { reason } : {}),
      source: "command",
    });
    await replyPrivately(
      interaction,
      `${target.tag} recebeu timeout por ${minutes} minuto(s).`,
    );
  },
};

export default command;
