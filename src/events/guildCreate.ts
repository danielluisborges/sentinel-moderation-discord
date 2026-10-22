import { Events, type Guild } from "discord.js";
import { logger } from "../logger.js";
import { commandRegistrationService } from "../services/commandRegistration.service.js";

export default {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    try {
      const commandCount = await commandRegistrationService.registerGuild(
        guild.id,
      );
      logger.info(
        { guildId: guild.id, commandCount },
        "Comandos registrados após entrada em novo servidor",
      );
    } catch (error) {
      logger.warn(
        { err: error, guildId: guild.id },
        "Não foi possível registrar comandos no novo servidor",
      );
    }
  },
};
