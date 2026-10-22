import { ChannelType, PermissionFlagsBits, type Guild } from "discord.js";
import { env } from "../env.js";
import type { GuildSettingsDTO } from "../shared/dto.js";
import { configService } from "./config.service.js";
import { HttpError } from "../web/http/errors.js";

export interface GuildSettingsUpdate {
  logChannelId?: string | null;
  modRoleId?: string | null;
  aiEnabled?: boolean;
}

export class SettingsService {
  async get(guild: Guild): Promise<GuildSettingsDTO> {
    const [config, roles, channels] = await Promise.all([
      configService.getGuildConfig(guild.id),
      guild.roles.fetch(),
      guild.channels.fetch(),
    ]);
    return {
      logChannelId: config.logChannelId,
      modRoleId: config.modRoleId,
      aiEnabled: config.aiEnabled,
      aiConfigured:
        env.AI_PROVIDER === "gemini"
          ? Boolean(env.GEMINI_API_KEY)
          : Boolean(env.AI_FALLBACK_KEY),
      aiProvider: env.AI_PROVIDER,
      aiFallbackConfigured: Boolean(
        env.AI_FALLBACK_PROVIDER && env.AI_FALLBACK_KEY,
      ),
      roles: roles
        .filter((role) => role.id !== guild.id && !role.managed)
        .sort((a, b) => b.position - a.position)
        .map(({ id, name }) => ({ id, name })),
      textChannels: [...channels.values()]
        .filter(
          (channel) =>
            channel?.type === ChannelType.GuildText &&
            !channel
              .permissionsFor(guild.roles.everyone)
              .has(PermissionFlagsBits.ViewChannel),
        )
        .map((channel) => ({ id: channel!.id, name: channel!.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    };
  }

  async update(guild: Guild, updates: GuildSettingsUpdate): Promise<void> {
    if (updates.modRoleId !== undefined) {
      if (updates.modRoleId) {
        const role = await guild.roles.fetch(updates.modRoleId);
        if (!role || role.id === guild.id || role.managed) {
          throw new HttpError(400, "Selecione um cargo válido deste servidor.");
        }
      }
      await configService.setModRole(guild.id, updates.modRoleId);
    }
    if (updates.logChannelId !== undefined) {
      if (updates.logChannelId) {
        const channel = await guild.channels.fetch(updates.logChannelId);
        if (
          !channel ||
          channel.type !== ChannelType.GuildText ||
          channel
            .permissionsFor(guild.roles.everyone)
            .has(PermissionFlagsBits.ViewChannel)
        ) {
          throw new HttpError(
            400,
            "Escolha um canal de texto privado para os logs.",
          );
        }
      }
      await configService.setLogChannel(guild.id, updates.logChannelId);
    }
    if (updates.aiEnabled !== undefined) {
      await configService.setAIEnabled(guild.id, updates.aiEnabled);
    }
  }
}

export const settingsService = new SettingsService();
