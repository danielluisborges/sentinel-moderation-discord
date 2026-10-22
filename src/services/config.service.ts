import type { ConfigStore } from "../storage/ConfigStore.js";
import { JsonFileStore } from "../storage/jsonFileStore.js";
import type { GuildConfig } from "../types/config.js";

export class ConfigService {
  private readonly cache = new Map<string, GuildConfig>();
  private readonly updateQueues = new Map<string, Promise<void>>();

  constructor(private readonly store: ConfigStore) {}

  async getGuildConfig(guildId: string): Promise<GuildConfig> {
    const cached = this.cache.get(guildId);
    if (cached) return cloneConfig(cached);

    const config = await this.store.getGuildConfig(guildId);
    this.cache.set(guildId, config);
    return cloneConfig(config);
  }

  setLogChannel(
    guildId: string,
    logChannelId: string | null,
  ): Promise<GuildConfig> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      logChannelId,
    }));
  }

  setModRole(guildId: string, modRoleId: string | null): Promise<GuildConfig> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      modRoleId,
    }));
  }

  setAIEnabled(guildId: string, aiEnabled: boolean): Promise<GuildConfig> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      aiEnabled,
    }));
  }

  setCommandEnabled(
    guildId: string,
    commandName: string,
    enabled: boolean,
  ): Promise<GuildConfig> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      disabledCommands: enabled
        ? current.disabledCommands.filter((name) => name !== commandName)
        : [...new Set([...current.disabledCommands, commandName])],
    }));
  }

  setAutomations(
    guildId: string,
    settings: Pick<
      GuildConfig,
      | "welcomeEnabled"
      | "welcomeChannelId"
      | "welcomeMessage"
      | "leaveEnabled"
      | "leaveChannelId"
      | "leaveMessage"
    >,
  ): Promise<GuildConfig> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      ...settings,
    }));
  }

  addWarning(guildId: string, userId: string): Promise<number> {
    return this.updateGuildConfig(guildId, (current) => ({
      ...current,
      warnCounts: {
        ...current.warnCounts,
        [userId]: (current.warnCounts[userId] ?? 0) + 1,
      },
    })).then((config) => config.warnCounts[userId] ?? 0);
  }

  private async updateGuildConfig(
    guildId: string,
    update: (current: GuildConfig) => GuildConfig,
  ): Promise<GuildConfig> {
    const previous = this.updateQueues.get(guildId) ?? Promise.resolve();
    let updated: GuildConfig | undefined;
    const operation = previous
      .catch(() => undefined)
      .then(async () => {
        const current = await this.getGuildConfig(guildId);
        updated = update(current);
        await this.store.saveGuildConfig(guildId, updated);
        this.cache.set(guildId, updated);
      });

    this.updateQueues.set(guildId, operation);
    try {
      await operation;
      return cloneConfig(updated!);
    } finally {
      if (this.updateQueues.get(guildId) === operation) {
        this.updateQueues.delete(guildId);
      }
    }
  }
}

function cloneConfig(config: GuildConfig): GuildConfig {
  return {
    ...config,
    warnCounts: { ...config.warnCounts },
    disabledCommands: [...config.disabledCommands],
  };
}

export const configService = new ConfigService(new JsonFileStore());
