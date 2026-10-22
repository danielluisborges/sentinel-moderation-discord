import type { GuildConfig } from "../types/config.js";

export interface ConfigStore {
  getGuildConfig(guildId: string): Promise<GuildConfig>;
  saveGuildConfig(guildId: string, config: GuildConfig): Promise<void>;
}
