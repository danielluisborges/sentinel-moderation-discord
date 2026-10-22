import { Events, type ChatInputCommandInteraction } from "discord.js";
import { logger } from "../logger.js";
import { ModerationError } from "../utils/permissions.js";
import { configService } from "../services/config.service.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (interaction.guildId) {
        const config = await configService.getGuildConfig(interaction.guildId);
        if (config.disabledCommands.includes(interaction.commandName)) {
          await interaction.reply({
            content: "Esse comando está desativado neste servidor pelo painel.",
            ephemeral: true,
          });
          return;
        }
      }
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        { err: error, command: interaction.commandName },
        "Falha ao executar comando",
      );
      const message =
        error instanceof ModerationError
          ? error.message
          : "Não foi possível executar esse comando. Tente novamente.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
  },
};
