import "dotenv/config";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["DISCORD_TOKEN", "GEMINI_API_KEY", "AI_FALLBACK_KEY", "JWT_SECRET"],
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
});
