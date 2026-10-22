import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requireAuth, readCookie } from "../src/web/middleware/requireAuth.js";
import { requireGuildAdmin } from "../src/web/middleware/requireGuildAdmin.js";

describe("web authentication middleware", () => {
  it("parses a named cookie without matching similarly named cookies", () => {
    expect(readCookie("other=abc; sentinel_session=jwt%2Evalue", "sentinel_session")).toBe(
      "jwt.value",
    );
    expect(readCookie("sentinel_session_extra=wrong", "sentinel_session")).toBeUndefined();
  });

  it("returns 401 when a protected request has no session cookie", async () => {
    const response = mockResponse();
    await requireAuth(
      { headers: {} } as Request,
      response,
      vi.fn(),
    );
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Autenticação necessária." });
  });

  it("returns 403 when no authenticated guild session is available", async () => {
    const response = mockResponse();
    await requireGuildAdmin(
      { params: { guildId: "123456789012345" } } as unknown as Request,
      response,
      vi.fn(),
    );
    expect(response.status).toHaveBeenCalledWith(403);
  });
});

function mockResponse() {
  return {
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}
