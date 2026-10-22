import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
} from "discord.js";
import type { GuildConfig } from "../types/config.js";
import { configService } from "./config.service.js";
import { loggerService } from "./logger.service.js";
import { HttpError } from "../web/http/errors.js";

export type AutomationUpdate = Pick<
  GuildConfig,
  | "welcomeEnabled"
  | "welcomeChannelId"
  | "welcomeMessage"
  | "leaveEnabled"
  | "leaveChannelId"
  | "leaveMessage"
>;

export class AutomationsService {
  async get(guild: Guild) {
    const [config, channels] = await Promise.all([
      configService.getGuildConfig(guild.id),
      guild.channels.fetch(),
    ]);
    return {
      welcomeEnabled: config.welcomeEnabled,
      welcomeChannelId: config.welcomeChannelId,
      welcomeMessage: config.welcomeMessage,
      leaveEnabled: config.leaveEnabled,
      leaveChannelId: config.leaveChannelId,
      leaveMessage: config.leaveMessage,
      textChannels: [...channels.values()]
        .filter((channel) => channel?.type === ChannelType.GuildText)
        .map((channel) => ({ id: channel!.id, name: channel!.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    };
  }

  async update(
    guild: Guild,
    settings: AutomationUpdate,
    executor: GuildMember | null,
  ): Promise<void> {
    const botMember = guild.members.me ?? (await guild.members.fetchMe());
    for (const [enabled, channelId] of [
      [settings.welcomeEnabled, settings.welcomeChannelId],
      [settings.leaveEnabled, settings.leaveChannelId],
    ] as const) {
      if (!channelId) continue;
      const channel = await guild.channels.fetch(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) {
        throw new HttpError(400, "Selecione canais de texto deste servidor.");
      }
      if (
        enabled &&
        !channel
          .permissionsFor(botMember)
          ?.has(PermissionFlagsBits.SendMessages)
      ) {
        throw new HttpError(
          400,
          `O Sentinel precisa da permissão Enviar mensagens em #${channel.name}.`,
        );
      }
    }
    if (settings.welcomeEnabled && !settings.welcomeChannelId) {
      throw new HttpError(400, "Selecione o canal para as boas-vindas.");
    }
    if (settings.leaveEnabled && !settings.leaveChannelId) {
      throw new HttpError(400, "Selecione o canal para mensagens de saída.");
    }

    await configService.setAutomations(guild.id, settings);
    try {
      await loggerService.logDiscordEvent(guild, {
        title: "Mensagens automáticas atualizadas",
        executor: executor?.user ?? null,
        source: "panel",
        details: {
          "Boas-vindas": settings.welcomeEnabled ? "Ativadas" : "Desativadas",
          "Canal de boas-vindas": settings.welcomeChannelId
            ? `<#${settings.welcomeChannelId}>`
            : "Não definido",
          "Mensagem de boas-vindas": settings.welcomeMessage,
          "Mensagem de saída": settings.leaveEnabled ? "Ativada" : "Desativada",
          "Canal de saída": settings.leaveChannelId
            ? `<#${settings.leaveChannelId}>`
            : "Não definido",
          "Texto de saída": settings.leaveMessage,
        },
      });
    } catch {
      throw new HttpError(400, "Não foi possível salvar as automações.");
    }
  }
}

export const automationsService = new AutomationsService();
