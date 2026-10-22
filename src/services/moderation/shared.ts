import type {
  Guild,
  GuildMember,
  PermissionResolvable,
  Role,
  TextChannel,
} from "discord.js";
import type { ConfigService } from "../config.service.js";
import type { LoggerService } from "../logger.service.js";
import {
  assertModerationAccess,
  ModerationError,
} from "../../utils/permissions.js";

export type ModerationSource = "command" | "panel";

export interface BaseAction {
  guild: Guild;
  executor: GuildMember;
  reason?: string;
  source: ModerationSource;
}

export interface TargetAction extends BaseAction {
  targetId: string;
}

export interface EditMemberAction extends TargetAction {
  nickname: string | null;
  roleIds: string[];
}

export interface CreateRoleAction extends BaseAction {
  name: string;
  color: number;
  hoist: boolean;
  mentionable: boolean;
  permissions: bigint[];
  permissionLabels: string[];
}

export interface DeleteRoleAction extends BaseAction {
  role: Role;
  memberCount: number;
}

export interface ClearAction extends BaseAction {
  channel: TextChannel;
  amount: number;
}

const timeoutMaxMs = 28 * 24 * 60 * 60 * 1000;

export async function prepareModerationAction(
  configs: ConfigService,
  logs: LoggerService,
  guild: Guild,
  executor: GuildMember,
  requiredPermission: PermissionResolvable,
  target?: GuildMember,
): Promise<TextChannel> {
  const config = await configs.getGuildConfig(guild.id);
  await assertModerationAccess({
    guild,
    executor,
    config,
    requiredPermission,
    ...(target ? { target } : {}),
  });
  return logs.prepareLogChannel(guild);
}

export async function requireMember(
  guild: Guild,
  userId: string,
): Promise<GuildMember> {
  try {
    return await guild.members.fetch(userId);
  } catch {
    throw new ModerationError("Não encontrei esse membro neste servidor.");
  }
}

export async function findMemberIfPresent(
  guild: Guild,
  userId: string,
): Promise<GuildMember | null> {
  try {
    return await guild.members.fetch(userId);
  } catch (error) {
    if (isUnknownMember(error)) return null;
    throw error;
  }
}

export function isUnknownMember(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 10007
  );
}

export function assertSnowflake(value: string): void {
  if (!/^\d{15,22}$/.test(value)) {
    throw new ModerationError("Informe um ID válido do Discord.");
  }
}

export function normalizeReason(reason?: string): string | undefined {
  const normalized = reason?.trim();
  return normalized ? normalized.slice(0, 512) : undefined;
}

export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return [
    days > 0 ? `${days}d` : "",
    hours > 0 ? `${hours}h` : "",
    minutes > 0 ? `${minutes}min` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function isValidTimeoutDuration(durationMs: number): boolean {
  return (
    Number.isInteger(durationMs) &&
    durationMs >= 60_000 &&
    durationMs <= timeoutMaxMs
  );
}
