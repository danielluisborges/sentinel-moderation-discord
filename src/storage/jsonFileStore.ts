import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { createDefaultGuildConfig, type GuildConfig } from "../types/config.js";
import type { ConfigStore } from "./ConfigStore.js";

const guildConfigSchema = z.object({
  guildId: z.string().regex(/^\d+$/),
  logChannelId: z.string().regex(/^\d+$/).nullable(),
  modRoleId: z.string().regex(/^\d+$/).nullable(),
  aiEnabled: z.boolean().default(true),
  warnCounts: z.record(z.string(), z.number().int().nonnegative()).default({}),
  disabledCommands: z.array(z.string()).default([]),
  welcomeEnabled: z.boolean().default(false),
  welcomeChannelId: z.string().regex(/^\d+$/).nullable().default(null),
  welcomeMessage: z
    .string()
    .max(2000)
    .default("Boas-vindas, {user}! Você chegou ao {server}."),
  leaveEnabled: z.boolean().default(false),
  leaveChannelId: z.string().regex(/^\d+$/).nullable().default(null),
  leaveMessage: z.string().max(2000).default("{username} saiu do {server}."),
});

export class JsonFileStore implements ConfigStore {
  constructor(
    private readonly directory = join(process.cwd(), "data", "guilds"),
  ) {}

  async getGuildConfig(guildId: string): Promise<GuildConfig> {
    const filePath = this.getFilePath(guildId);

    try {
      const content = await readFile(filePath, "utf8");
      const parsed = guildConfigSchema.safeParse(
        JSON.parse(content) as unknown,
      );
      if (!parsed.success || parsed.data.guildId !== guildId) {
        throw new Error(`Configuração inválida para o servidor ${guildId}.`);
      }
      return parsed.data;
    } catch (error) {
      if (isMissingFile(error)) return createDefaultGuildConfig(guildId);
      throw error;
    }
  }

  async saveGuildConfig(guildId: string, config: GuildConfig): Promise<void> {
    const parsed = guildConfigSchema.safeParse(config);
    if (!parsed.success || parsed.data.guildId !== guildId) {
      throw new Error(`Configuração inválida para o servidor ${guildId}.`);
    }

    await mkdir(this.directory, { recursive: true });
    const filePath = this.getFilePath(guildId);
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

    try {
      await writeFile(
        temporaryPath,
        `${JSON.stringify(parsed.data, null, 2)}\n`,
        "utf8",
      );
      await rename(temporaryPath, filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }

  private getFilePath(guildId: string): string {
    if (!/^\d+$/.test(guildId)) {
      throw new Error("O ID do servidor precisa conter apenas números.");
    }
    return join(this.directory, `${guildId}.json`);
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
