import type { Response } from "express";
import type { Guild, GuildMember } from "discord.js";
import { client } from "../../client.js";
import { sendRouteError, type RouteErrorOptions } from "./errors.js";

type GuildAction = (guild: Guild) => Promise<void>;
type GuildExecutorAction = (
  guild: Guild,
  executor: GuildMember,
) => Promise<void>;

export async function withGuild(
  res: Response,
  action: GuildAction,
): Promise<void> {
  const guild = client.guilds.cache.get(res.locals.guildId);
  if (!guild) {
    res.status(404).json({ error: "Servidor não encontrado pelo Sentinel." });
    return;
  }
  await action(guild);
}

export async function withGuildExecutor(
  res: Response,
  action: GuildExecutorAction,
  onError?: RouteErrorOptions,
): Promise<void> {
  const guild = client.guilds.cache.get(res.locals.guildId);
  const session = res.locals.sentinelSession;
  if (!guild || !session) {
    res.status(404).json({ error: "Servidor ou sessão não encontrados." });
    return;
  }
  try {
    const executor = await guild.members.fetch(session.userId);
    await action(guild, executor);
  } catch (error) {
    if (!onError) throw error;
    sendRouteError(res, error, onError);
  }
}
