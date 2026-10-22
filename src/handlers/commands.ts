import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "discord.js";
import type { Command } from "../types/command.js";

const commandsDirectory = fileURLToPath(
  new URL("../commands/", import.meta.url),
);

export async function loadCommands(client: Client): Promise<Command[]> {
  const commands: Command[] = [];

  for (const group of await readdir(commandsDirectory, {
    withFileTypes: true,
  })) {
    if (!group.isDirectory()) continue;
    const groupDirectory = join(commandsDirectory, group.name);

    for (const entry of await readdir(groupDirectory, {
      withFileTypes: true,
    })) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      const moduleUrl = new URL(
        `../commands/${group.name}/${entry.name}`,
        import.meta.url,
      );
      const loaded = (await import(moduleUrl.href)) as { default?: Command };
      if (!loaded.default) continue;
      commands.push(loaded.default);
      client.commands.set(loaded.default.data.name, loaded.default);
    }
  }

  return commands;
}

declare module "discord.js" {
  interface Client {
    commands: Map<string, Command>;
  }
}
