import { SlashCommandBuilder } from "discord.js";
import { aiService } from "../../services/ai.service.js";
import { chunkMessage } from "../../utils/chunkMessage.js";
import type { Command } from "../../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("prompt")
    .setDescription("Converse com a IA do Sentinel.")
    .addStringOption((option) =>
      option
        .setName("pergunta")
        .setDescription("O que você gostaria de perguntar?")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(1800),
    ),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const answer = await aiService.ask(
        interaction.user.id,
        interaction.options.getString("pergunta", true),
        interaction.guildId,
      );
      const [first, ...rest] = chunkMessage(answer);
      await interaction.editReply(first ?? "A IA não retornou uma resposta.");
      for (const chunk of rest) await interaction.followUp({ content: chunk });
    } catch (error) {
      if (error instanceof Error && error.name === "AIServiceError") {
        await interaction.editReply(error.message);
        return;
      }
      throw error;
    }
  },
};

export default command;
