import "dotenv/config";
import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().optional(),
);

const envSchema = z.object({
  DISCORD_TOKEN: z.string().trim().min(1, "DISCORD_TOKEN é obrigatória."),
  DISCORD_CLIENT_ID: optionalText,
  DISCORD_CLIENT_SECRET: optionalText,
  DISCORD_REDIRECT_URI: optionalText,
  DEV_GUILD_ID: optionalText,
  SERVER_ID: optionalText,
  GEMINI_API_KEY: optionalText,
  AI_PROVIDER: z.preprocess(
    (value) => (value === undefined || value === "" ? "gemini" : value),
    z.enum(["gemini", "deepseek"]),
  ),
  AI_FALLBACK_PROVIDER: optionalText,
  AI_FALLBACK_KEY: optionalText,
  JWT_SECRET: optionalText,
  PORT: z.preprocess(
    (value) => (value === undefined || value === "" ? "3000" : value),
    z.coerce.number().int().positive(),
  ),
  NODE_ENV: z.preprocess(
    (value) => (value === undefined || value === "" ? "development" : value),
    z.enum(["development", "production", "test"]),
  ),
  SESSION_DURATION_MINUTES: z.preprocess(
    (value) => (value === undefined || value === "" ? "10" : value),
    z.coerce.number().int().min(1).max(120),
  ),
  PANEL_URL: optionalText,
  CONFIG_STORE: z.preprocess(
    (value) => (value === undefined || value === "" ? "json" : value),
    z.enum(["json", "channel"]),
  ),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
}

export const env = result.data;
