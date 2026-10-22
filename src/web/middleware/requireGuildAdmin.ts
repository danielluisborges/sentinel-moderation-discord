import type { RequestHandler } from "express";
import { client } from "../../client.js";
import { fetchUserGuilds } from "../auth/discordOAuth.js";

const administratorPermission = 0x8n;
const manageGuildPermission = 0x20n;

export const requireGuildAdmin: RequestHandler = async (req, res, next) => {
  const guildId = req.params.guildId;
  const session = res.locals.sentinelSession;
  if (typeof guildId !== "string" || !session) {
    res.status(403).json({ error: "Acesso negado a este servidor." });
    return;
  }

  try {
    const guilds = await fetchUserGuilds(session);
    const guild = guilds.find((entry) => entry.id === guildId);
    const permissionString = guild?.permissions_new ?? guild?.permissions;
    const permissions = permissionString ? BigInt(permissionString) : 0n;
    const isAdmin = Boolean(
      guild &&
        (guild.owner ||
          (permissions & (administratorPermission | manageGuildPermission)) !== 0n),
    );
    if (!isAdmin || !client.guilds.cache.has(guildId)) {
      res.status(403).json({ error: "Acesso negado a este servidor." });
      return;
    }
    res.locals.guildId = guildId;
    next();
  } catch {
    res.status(503).json({ error: "Não foi possível validar suas permissões no Discord." });
  }
};
