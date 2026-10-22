import { REST, Routes } from "discord.js";
import { loadCommands } from "../src/handlers/commands.js";
import { env } from "../src/env.js";
import { client } from "../src/client.js";

client.commands = new Map();
const commands = await loadCommands(client);
const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
const body = commands.map((command) => command.data.toJSON());
const guildId = env.DEV_GUILD_ID ?? env.SERVER_ID;
const botUser = (await rest.get(Routes.user("@me"))) as { id: string };
const applicationId = env.DISCORD_CLIENT_ID ?? botUser.id;

const route = guildId
  ? Routes.applicationGuildCommands(applicationId, guildId)
  : Routes.applicationCommands(applicationId);

await rest.put(route, { body });
console.info(
  `Registrados ${body.length} comandos ${guildId ? "no servidor de desenvolvimento" : "globalmente"}.`,
);
