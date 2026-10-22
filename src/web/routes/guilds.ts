import { Router } from "express";
import { client } from "../../client.js";
import { fetchUserGuilds } from "../auth/discordOAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const guildsRouter = Router();

guildsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const guilds = await fetchUserGuilds(res.locals.sentinelSession);
    const eligible = guilds
      .filter((guild) => {
        const permissions = BigInt(guild.permissions_new ?? guild.permissions ?? "0");
        return (
          client.guilds.cache.has(guild.id) &&
          (guild.owner || (permissions & (0x8n | 0x20n)) !== 0n)
        );
      })
      .map(({ id, name, icon }) => ({ id, name, icon }));
    res.json(eligible);
  } catch {
    res.status(503).json({ error: "Não foi possível carregar seus servidores do Discord." });
  }
});

