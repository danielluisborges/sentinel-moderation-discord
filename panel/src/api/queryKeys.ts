export const queryKeys = {
  guilds: () => ["guilds"] as const,
  settings: (guildId: string) => ["settings", guildId] as const,
  roleDetails: (guildId: string, roleId?: string) =>
    roleId
      ? (["role-details", guildId, roleId] as const)
      : (["role-details", guildId] as const),
  commands: (guildId: string) => ["commands", guildId] as const,
  automations: (guildId: string) => ["automations", guildId] as const,
  channels: (guildId: string) => ["channels", guildId] as const,
  members: (guildId: string, search?: string) =>
    search === undefined
      ? (["members", guildId] as const)
      : (["members", guildId, search] as const),
  bans: (guildId: string) => ["bans", guildId] as const,
  overview: (guildId: string) => ["overview", guildId] as const,
  memberEditOptions: (guildId: string, memberId: string) =>
    ["member-edit-options", guildId, memberId] as const,
  serverSearchMembers: (guildId: string, search?: string) =>
    search === undefined
      ? (["server-search-members", guildId] as const)
      : (["server-search-members", guildId, search] as const),
  serverSearchChannels: (guildId: string) =>
    ["server-search-channels", guildId] as const,
};
