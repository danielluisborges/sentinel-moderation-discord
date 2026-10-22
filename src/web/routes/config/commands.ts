import { Router } from "express";
import { z } from "zod";
import { client } from "../../../client.js";
import { commandRegistrationService } from "../../../services/commandRegistration.service.js";
import { configService } from "../../../services/config.service.js";
import { loggerService } from "../../../services/logger.service.js";
import { withGuildExecutor } from "../../http/guildContext.js";
import { HttpError, sendRouteError } from "../../http/errors.js";

export const commandsRouter = Router({ mergeParams: true });

commandsRouter.post("/register", async (_req, res) => {
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      const commandCount = await commandRegistrationService.registerGuild(
        guild.id,
      );

      try {
        await loggerService.logDiscordEvent(guild, {
          title: "Comandos do servidor sincronizados",
          executor: executor.user,
          source: "panel",
          details: { Comandos: String(commandCount) },
        });
      } catch {
        // The logger already records the failure; command registration succeeded.
      }
      res.json({ commandCount });
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível registrar os comandos neste servidor.",
      logMessage: "Falha ao registrar comandos do servidor pelo painel",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

commandsRouter.get("/", async (_req, res) => {
  try {
    const config = await configService.getGuildConfig(res.locals.guildId);
    const disabled = new Set(config.disabledCommands);
    const commands = [...client.commands.values()]
      .map((command) => {
        const data = command.data.toJSON();
        return {
          name: data.name,
          description: data.description,
          enabled: !disabled.has(data.name),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    res.json({ commands });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar os comandos.",
      logMessage: "Falha ao carregar comandos do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

commandsRouter.patch("/:commandName", async (req, res) => {
  const name = z
    .string()
    .regex(/^[a-z0-9-]{1,32}$/)
    .safeParse(req.params.commandName);
  const enabled = z.boolean().safeParse(req.body?.enabled);
  if (!name.success || !enabled.success) {
    res.status(400).json({ error: "Confira o comando e o estado solicitado." });
    return;
  }
  if (!client.commands.has(name.data)) {
    res.status(404).json({ error: "Comando não encontrado." });
    return;
  }
  try {
    await withGuildExecutor(res, async (guild, executor) => {
      await configService.setCommandEnabled(guild.id, name.data, enabled.data);
      try {
        await loggerService.logDiscordEvent(guild, {
          title: enabled.data ? "Comando ativado" : "Comando desativado",
          executor: executor.user,
          source: "panel",
          details: { Comando: `/${name.data}` },
        });
      } catch {
        throw new HttpError(400, "Não foi possível atualizar o comando.");
      }
      res.status(204).end();
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 400,
      message: "Não foi possível atualizar o comando.",
      logMessage: "Falha ao atualizar comando do servidor",
      context: { guildId: String(res.locals.guildId), commandName: name.data },
    });
  }
});
