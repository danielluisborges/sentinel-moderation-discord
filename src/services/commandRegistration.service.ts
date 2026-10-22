import { REST, Routes } from "discord.js";
import { client } from "../client.js";
import { env } from "../env.js";
import { logger } from "../logger.js";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

export class CommandRegistrationService {
  async registerGuild(guildId: string): Promise<number> {
    if (!client.isReady() || !client.application) {
      throw new Error("O Sentinel ainda está iniciando.");
    }
    const commands = [...client.commands.values()].map((command) =>
      command.data.toJSON(),
    );
    await rest.put(
      Routes.applicationGuildCommands(client.application.id, guildId),
      { body: commands },
    );
    return commands.length;
  }

  async registerAllGuilds(): Promise<void> {
    const guilds = [...client.guilds.cache.values()];
    const results = await Promise.allSettled(
      guilds.map(async (guild) => {
        const commandCount = await this.registerGuild(guild.id);
        logger.info(
          { guildId: guild.id, commandCount },
          "Comandos do Sentinel sincronizados no servidor",
        );
      }),
    );
    const failedGuildIds = results.flatMap((result, index) => {
      const guild = guilds[index];
      return result.status === "rejected" && guild ? [guild.id] : [];
    });
    if (failedGuildIds.length) {
      logger.warn(
        { failedGuildIds },
        "Falha ao sincronizar comandos em alguns servidores",
      );
    }
  }
}

export const commandRegistrationService = new CommandRegistrationService();
