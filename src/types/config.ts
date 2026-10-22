export interface GuildConfig {
  guildId: string;
  logChannelId: string | null;
  modRoleId: string | null;
  aiEnabled: boolean;
  warnCounts: Record<string, number>;
  disabledCommands: string[];
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string;
  leaveEnabled: boolean;
  leaveChannelId: string | null;
  leaveMessage: string;
}

export function createDefaultGuildConfig(guildId: string): GuildConfig {
  return {
    guildId,
    logChannelId: null,
    modRoleId: null,
    aiEnabled: true,
    warnCounts: {},
    disabledCommands: [],
    welcomeEnabled: false,
    welcomeChannelId: null,
    welcomeMessage: "Boas-vindas, {user}! Você chegou ao {server}.",
    leaveEnabled: false,
    leaveChannelId: null,
    leaveMessage: "{username} saiu do {server}.",
  };
}
