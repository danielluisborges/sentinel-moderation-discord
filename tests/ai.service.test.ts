import { describe, expect, it, vi } from "vitest";
import type { TextModel } from "../src/ai/gemini.js";
import { AIService, AIServiceError } from "../src/services/ai.service.js";
import { Cooldown } from "../src/utils/cooldown.js";

describe("AIService", () => {
  it("returns model responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model: TextModel = { generate: vi.fn().mockResolvedValue(" Olá! ") };
    const service = new AIService(model, new Cooldown(30_000));

    await expect(service.ask("user-1", "Oi")).resolves.toBe("Olá!");
    vi.unstubAllEnvs();
  });

  it("maps quota errors to a safe message", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model: TextModel = {
      generate: vi.fn().mockRejectedValue({ status: 429, message: "quota exceeded" }),
    };
    const service = new AIService(model, new Cooldown(30_000));

    await expect(service.ask("user-2", "Oi")).rejects.toMatchObject({
      name: "AIServiceError",
      message: expect.stringContaining("cota"),
    });
    vi.unstubAllEnvs();
  });

  it("requires an API key before calling the provider", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const generate = vi.fn();
    const service = new AIService({ generate }, new Cooldown(30_000));

    await expect(service.ask("user-3", "Oi")).rejects.toBeInstanceOf(AIServiceError);
    expect(generate).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
