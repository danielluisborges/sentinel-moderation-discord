import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica se o Sentinel está online."),
  async execute(interaction) {
    await interaction.reply(
      `Pong! Latência: ${interaction.client.ws.ping} ms.`,
    );
  },
};

export default command;
