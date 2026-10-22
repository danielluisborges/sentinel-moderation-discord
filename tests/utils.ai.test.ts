import { describe, expect, it } from "vitest";
import { Cooldown } from "../src/utils/cooldown.js";
import { chunkMessage } from "../src/utils/chunkMessage.js";

describe("cooldown", () => {
  it("tracks cooldowns per user and expires them", () => {
    let now = 100;
    const cooldown = new Cooldown(1000, () => now);
    expect(cooldown.consume("a")).toBe(0);
    expect(cooldown.consume("a")).toBe(1000);
    expect(cooldown.consume("b")).toBe(0);
    now += 1000;
    expect(cooldown.consume("a")).toBe(0);
  });
});

describe("chunkMessage", () => {
  it("splits long responses within Discord's limit", () => {
    const chunks = chunkMessage("palavra ".repeat(1000));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 2000)).toBe(true);
    expect(chunks.join(" ")).toContain("palavra");
  });
});
