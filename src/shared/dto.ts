export interface GuildDTO {
  id: string;
  name: string;
  icon: string | null;
}

export interface GuildOverviewDTO {
  memberCount: number;
  channelCount: number;
  categoryCount: number;
  textChannelCount: number;
  voiceChannelCount: number;
}

export interface GuildSettingsDTO {
  logChannelId: string | null;
  modRoleId: string | null;
  aiEnabled: boolean;
  aiConfigured: boolean;
  aiProvider: "gemini" | "deepseek";
  aiFallbackConfigured: boolean;
  roles: Array<{ id: string; name: string }>;
  textChannels: Array<{ id: string; name: string }>;
}

export interface CommandSettingsDTO {
  commands: Array<{ name: string; description: string; enabled: boolean }>;
}

export interface AutomationSettingsDTO {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string;
  leaveEnabled: boolean;
  leaveChannelId: string | null;
  leaveMessage: string;
  textChannels: Array<{ id: string; name: string }>;
}

export interface MemberDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isSentinel: boolean;
  roles: string[];
  roleIds: string[];
  joinedAt: string | null;
}

export interface MemberEditOptionsDTO {
  nickname: string;
  roleIds: string[];
  roles: Array<{ id: string; name: string }>;
}

export interface RoleDetailsDTO {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  members: { id: string; name: string; username: string; avatarUrl: string }[];
}

export interface MemberPageDTO {
  members: MemberDTO[];
  nextAfter: string | null;
}

export interface BanDTO {
  userId: string;
  username: string;
  avatarUrl: string | null;
  reason: string | null;
}

export interface CreateBanRequest {
  userId: string;
  reason?: string | undefined;
}

export type ChannelKind =
  "text" | "voice" | "stage" | "category" | "announcement" | "forum" | "media";
export type CreateChannelKind = Exclude<ChannelKind, "media">;

export interface ChannelDTO {
  id: string;
  name: string;
  type: ChannelKind;
  position: number;
  parentId: string | null;
  topic: string | null;
  children: ChannelDTO[];
}

export interface ChannelTreeDTO {
  categories: ChannelDTO[];
  uncategorized: ChannelDTO[];
}

export interface CreateChannelRequest {
  name: string;
  type: CreateChannelKind;
  visibility: "public" | "moderators";
  parentId?: string | null | undefined;
  topic?: string | undefined;
}

export interface ChannelStructureChannel {
  name: string;
  type: Exclude<CreateChannelKind, "category">;
  visibility: "public" | "moderators";
  topic?: string | undefined;
}

export interface ChannelStructureCategory {
  name: string;
  visibility: "public" | "moderators";
  channels: ChannelStructureChannel[];
}

export interface ChannelStructurePlan {
  categories: ChannelStructureCategory[];
  channels: ChannelStructureChannel[];
}

export interface UpdateChannelRequest {
  name: string;
  topic?: string | undefined;
}

export interface ChannelPositionUpdate {
  id: string;
  position: number;
  parentId: string | null;
}
