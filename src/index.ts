import { client } from "./client.js";
import { loadCommands } from "./handlers/commands.js";
import { loadEvents } from "./handlers/events.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { startWebServer } from "./web/server.js";

client.commands = new Map();

try {
  await loadCommands(client);
  await loadEvents(client);
  await client.login(env.DISCORD_TOKEN);
  startWebServer();
} catch (error) {
  logger.fatal({ err: error }, "Não foi possível iniciar o Sentinel");
  process.exitCode = 1;
}
