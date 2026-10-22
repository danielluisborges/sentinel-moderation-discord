import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Client, ClientEvents } from "discord.js";
import { logger } from "../logger.js";

interface EventModule {
  name: keyof ClientEvents;
  once?: boolean;
  execute(...args: unknown[]): Promise<void> | void;
}

const eventsDirectory = fileURLToPath(new URL("../events/", import.meta.url));

export async function loadEvents(client: Client): Promise<void> {
  for (const entry of await readdir(eventsDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const moduleUrl = new URL(`../events/${entry.name}`, import.meta.url);
    const loaded = (await import(moduleUrl.href)) as { default?: EventModule };
    const event = loaded.default;
    if (!event) continue;

    const listener = (...args: unknown[]) => {
      Promise.resolve(event.execute(...args)).catch((error: unknown) => {
        logger.error(
          { err: error, event: event.name },
          "Falha ao executar evento",
        );
      });
    };

    if (event.once) client.once(event.name, listener as never);
    else client.on(event.name, listener as never);
  }
}
