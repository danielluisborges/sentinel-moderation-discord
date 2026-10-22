import { Events, type Client } from "discord.js";
import { logger } from "../logger.js";
import { commandRegistrationService } from "../services/commandRegistration.service.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    logger.info({ bot: client.user?.tag }, "Sentinel conectado ao Discord");
    await commandRegistrationService.registerAllGuilds();
  },
};
