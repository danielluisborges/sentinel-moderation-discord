import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigService } from "../src/services/config.service.js";
import { JsonFileStore } from "../src/storage/jsonFileStore.js";
import {
  createDefaultGuildConfig,
  type GuildConfig,
} from "../src/types/config.js";

const guildId = "123456789012345678";
const memberId = "234567890123456789";

describe("ConfigService", () => {
  it("serializes concurrent warning increments and preserves other settings", async () => {
    const store = new MemoryConfigStore();
    const service = new ConfigService(store);
    await service.setLogChannel(guildId, "345678901234567890");
    await service.setModRole(guildId, "456789012345678901");

    const counts = await Promise.all(
      Array.from({ length: 12 }, () => service.addWarning(guildId, memberId)),
    );

    expect(counts.sort((left, right) => left - right)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    await expect(service.getGuildConfig(guildId)).resolves.toEqual({
      guildId,
      logChannelId: "345678901234567890",
      modRoleId: "456789012345678901",
      warnCounts: { [memberId]: 12 },
    });
  });
});

describe("JsonFileStore", () => {
  let directory = "";

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "sentinel-config-"));
  });

  afterEach(async () => {
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it("loads saved configuration through a new store instance", async () => {
    const firstStore = new JsonFileStore(directory);
    const config = createDefaultGuildConfig(guildId);
    config.logChannelId = "345678901234567890";
    config.modRoleId = "456789012345678901";
    config.warnCounts[memberId] = 3;
    await firstStore.saveGuildConfig(guildId, config);

    const restartedStore = new JsonFileStore(directory);
    await expect(restartedStore.getGuildConfig(guildId)).resolves.toEqual(
      config,
    );
  });

  it("reads older configuration files without a warning-count field", async () => {
    await writeFile(
      join(directory, `${guildId}.json`),
      JSON.stringify({
        guildId,
        logChannelId: null,
        modRoleId: null,
      }),
      "utf8",
    );

    const result = await new JsonFileStore(directory).getGuildConfig(guildId);
    expect(result.warnCounts).toEqual({});
  });

  it("creates an independent default config when a server has no file", async () => {
    const store = new JsonFileStore(directory);
    const first = await store.getGuildConfig(guildId);
    const second = await store.getGuildConfig("567890123456789012");
    expect(first).toEqual(createDefaultGuildConfig(guildId));
    expect(second.warnCounts).toEqual({});
  });
});

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
