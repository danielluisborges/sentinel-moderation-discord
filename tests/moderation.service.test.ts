import {
  PermissionFlagsBits,
  PermissionsBitField,
  type Guild,
  type GuildMember,
  type TextChannel,
} from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { ConfigService } from "../src/services/config.service.js";
import { ModerationService } from "../src/services/moderation.service.js";
import type { LoggerService } from "../src/services/logger.service.js";
import { ModerationError } from "../src/utils/permissions.js";
import {
  createDefaultGuildConfig,
  type GuildConfig,
} from "../src/types/config.js";

const guildId = "123456789012345678";
const executorId = "234567890123456789";
const targetId = "345678901234567890";
const configuredModRole = "456789012345678901";

describe("ModerationService", () => {
  it("bans the target and writes an audit entry", async () => {
    const ban = vi.fn().mockResolvedValue(undefined);
    const { service, guild, executor, logger } = await setupModeration({ ban });

    await service.ban({
      guild,
      executor,
      targetId,
      reason: "Spam",
      source: "command",
    });

    expect(ban).toHaveBeenCalledWith(targetId, { reason: "Spam" });
    expect(logger.logModerationAction).toHaveBeenCalledWith(
      expect.anything(),
      guild,
      expect.objectContaining({ action: "ban", targetId, reason: "Spam" }),
    );
  });

  it("marks a panel ban in the private moderation log", async () => {
    const { service, guild, executor, logger } = await setupModeration({});

    await service.ban({ guild, executor, targetId, source: "panel" });

    expect(logger.logModerationAction).toHaveBeenCalledWith(
      expect.anything(),
      guild,
      expect.objectContaining({ action: "ban", targetId, source: "panel" }),
    );
  });

  it("marks a panel unban in the private moderation log", async () => {
    const { service, guild, executor, logger } = await setupModeration({});

    await service.unban({ guild, executor, targetId, source: "panel" });

    expect(logger.logModerationAction).toHaveBeenCalledWith(
      expect.anything(),
      guild,
      expect.objectContaining({ action: "unban", targetId, source: "panel" }),
    );
  });

  it("blocks a moderator when the target role is higher", async () => {
    const ban = vi.fn().mockResolvedValue(undefined);
    const { service, guild, executor } = await setupModeration({
      ban,
      executorPosition: -1,
    });

    await expect(
      service.ban({ guild, executor, targetId, source: "command" }),
    ).rejects.toBeInstanceOf(ModerationError);
    expect(ban).not.toHaveBeenCalled();
  });
});

async function setupModeration(options: {
  ban?: ReturnType<typeof vi.fn>;
  executorPosition?: number;
}): Promise<{
  service: ModerationService;
  guild: Guild;
  executor: GuildMember;
  logger: LoggerService;
}> {
  const configStore = new MemoryConfigStore();
  const configs = new ConfigService(configStore);
  await configs.setModRole(guildId, configuredModRole);
  await configs.setLogChannel(guildId, "567890123456789012");

  const executor = {
    id: executorId,
    permissions: new PermissionsBitField([PermissionFlagsBits.BanMembers]),
    roles: {
      cache: new Map([[configuredModRole, {}]]),
      highest: { comparePositionTo: () => options.executorPosition ?? 1 },
    },
  } as unknown as GuildMember;
  const target = {
    id: targetId,
    roles: { highest: {} },
  } as unknown as GuildMember;
  const botMember = {
    permissions: new PermissionsBitField([PermissionFlagsBits.BanMembers]),
    roles: { highest: { comparePositionTo: () => 1 } },
  } as unknown as GuildMember;
  const guild = {
    id: guildId,
    ownerId: "678901234567890123",
    members: {
      me: botMember,
      fetch: vi.fn().mockResolvedValue(target),
      ban: options.ban ?? vi.fn().mockResolvedValue(undefined),
      unban: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as Guild;
  const logger = {
    prepareLogChannel: vi.fn().mockResolvedValue({} as TextChannel),
    logModerationAction: vi.fn().mockResolvedValue(undefined),
  } as unknown as LoggerService;

  return {
    service: new ModerationService(configs, logger),
    guild,
    executor,
    logger,
  };
}

class MemoryConfigStore {
  private readonly configs = new Map<string, GuildConfig>();

  async getGuildConfig(id: string): Promise<GuildConfig> {
    const config = this.configs.get(id) ?? createDefaultGuildConfig(id);
    return { ...config, warnCounts: { ...config.warnCounts } };
  }

  async saveGuildConfig(id: string, config: GuildConfig): Promise<void> {
    this.configs.set(id, { ...config, warnCounts: { ...config.warnCounts } });
  }
}
