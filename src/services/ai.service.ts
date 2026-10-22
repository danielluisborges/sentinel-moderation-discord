import {
  GeminiModel,
  type ChannelStructureModel,
  type TextModel,
} from "../ai/gemini.js";
import { DeepSeekModel } from "../ai/deepseek.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { Cooldown } from "../utils/cooldown.js";
import { configService } from "./config.service.js";

const userCooldownMs = 30_000;
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIService {
  constructor(
    private readonly model: TextModel = createPrimaryModel(),
    private readonly cooldown: Cooldown = new Cooldown(userCooldownMs),
    private readonly channelStructureModel: ChannelStructureModel = createPrimaryChannelModel(),
    private readonly fallbackModel: (TextModel & ChannelStructureModel) | undefined = createFallbackModel(),
  ) {}

  async ask(
    userId: string,
    prompt: string,
    guildId?: string | null,
  ): Promise<string> {
    if (guildId) {
      const config = await configService.getGuildConfig(guildId);
      if (!config.aiEnabled) {
        throw new AIServiceError("A IA está desativada neste servidor.");
      }
    }
    if (!isPrimaryConfigured()) {
      throw new AIServiceError(
        `Configure a chave do provedor principal (${env.AI_PROVIDER === "gemini" ? "GEMINI_API_KEY" : "AI_FALLBACK_KEY"}) no backend e reinicie o Sentinel.`,
      );
    }
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) throw new AIServiceError("Escreva uma pergunta.");

    const remaining = this.cooldown.consume(userId);
    if (remaining > 0) {
      throw new AIServiceError(
        `Aguarde ${Math.ceil(remaining / 1000)} segundos antes de perguntar novamente.`,
      );
    }

    try {
      const answer = (
        await this.withFallback("generate", () => this.model.generate(normalizedPrompt), () =>
          this.fallbackModel?.generate(normalizedPrompt),
        )
      ).trim();
      if (!answer) {
        throw new AIServiceError(
          "A IA não retornou uma resposta. Tente novamente.",
        );
      }
      return answer;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      logger.error({ err: error }, "Falha ao consultar os provedores de IA");
      throw translateProviderError(error);
    }
  }

  async generateChannelStructure(
    userId: string,
    description: string,
  ): Promise<string> {
    if (!isPrimaryConfigured()) {
      throw new AIServiceError(
        `Configure a chave do provedor principal (${env.AI_PROVIDER === "gemini" ? "GEMINI_API_KEY" : "AI_FALLBACK_KEY"}) no ambiente do backend.`,
      );
    }
    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
      throw new AIServiceError("Descreva a estrutura de canais que você quer.");
    }
    const remaining = this.cooldown.consume(userId);
    if (remaining > 0) {
      throw new AIServiceError(
        `Aguarde ${Math.ceil(remaining / 1000)} segundos antes de pedir outra estrutura.`,
      );
    }

    const prompt = `Crie uma estrutura de canais Discord a partir desta descrição:\n${normalizedDescription}`;
    try {
      const plan = (
        await this.withFallback(
          "generateChannelStructure",
          () => this.channelStructureModel.generateChannelStructure(prompt),
          () => this.fallbackModel?.generateChannelStructure(prompt),
        )
      ).trim();
      if (!plan) throw new AIServiceError("A IA não retornou um plano.");
      return plan;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      logger.error(
        { err: error },
        "Falha ao gerar estrutura de canais com os provedores de IA",
      );
      throw translateProviderError(error);
    }
  }

  private async withFallback<T>(
    operation: string,
    primary: () => Promise<T>,
    fallback: () => Promise<T> | undefined,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await primary();
      } catch (error) {
        lastError = error;
        if (!isTransientError(error) || attempt === 2) break;
        await delay(500 * 2 ** attempt);
      }
    }

    const fallbackIsConfigured = Boolean(env.AI_FALLBACK_PROVIDER && env.AI_FALLBACK_KEY);
    if (!isTransientError(lastError) || !fallbackIsConfigured) throw lastError;

    logger.warn(
      {
        operation,
        primaryProvider: env.AI_PROVIDER,
        fallbackModel: env.AI_FALLBACK_PROVIDER,
        status: getStatus(lastError),
      },
      "Provedor principal indisponível após tentativas; acionando fallback",
    );
    const runFallback = fallback();
    if (!runFallback) throw lastError;
    try {
      return await runFallback;
    } catch (error) {
      logger.error(
        { err: error, operation, fallbackModel: env.AI_FALLBACK_PROVIDER },
        "O provedor de fallback também falhou",
      );
      throw error;
    }
  }
}

function createPrimaryModel(): TextModel {
  return env.AI_PROVIDER === "gemini" ? new GeminiModel() : new DeepSeekModel();
}

function createPrimaryChannelModel(): ChannelStructureModel {
  return env.AI_PROVIDER === "gemini" ? new GeminiModel() : new DeepSeekModel();
}

function createFallbackModel(): (TextModel & ChannelStructureModel) | undefined {
  if (!env.AI_FALLBACK_PROVIDER || !env.AI_FALLBACK_KEY) return undefined;
  if (/deepseek/i.test(env.AI_FALLBACK_PROVIDER)) return new DeepSeekModel();
  if (env.AI_FALLBACK_PROVIDER.toLowerCase() === "gemini") return new GeminiModel();
  return undefined;
}

function isPrimaryConfigured(): boolean {
  return env.AI_PROVIDER === "gemini"
    ? Boolean(env.GEMINI_API_KEY)
    : Boolean(env.AI_FALLBACK_KEY);
}

function isTransientError(error: unknown): boolean {
  const status = getStatus(error);
  if (status !== undefined) return transientStatuses.has(status);
  return error instanceof TypeError;
}

function getStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const value = (error as { status?: unknown }).status;
  return typeof value === "number" ? value : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function translateProviderError(error: unknown): AIServiceError {
  if (isQuotaError(error)) {
    return new AIServiceError(
      "A cota ou o limite temporário dos provedores de IA foi atingido. Tente novamente mais tarde.",
    );
  }
  const status = getStatus(error);
  if (status === 401 || status === 403) {
    return new AIServiceError(
      "Um provedor de IA rejeitou a chave configurada. Confira GEMINI_API_KEY e AI_FALLBACK_KEY no backend.",
    );
  }
  if (status === 400 || status === 404) {
    return new AIServiceError(
      "Um provedor de IA recusou a solicitação. Confira o modelo configurado e os logs do backend.",
    );
  }
  return new AIServiceError(
    "Os provedores de IA estão indisponíveis no momento. Tente novamente mais tarde.",
  );
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };
  const details = `${record.status ?? ""} ${record.code ?? ""} ${record.message ?? ""}`;
  return /429|resource.?exhausted|quota|rate.?limit/i.test(details);
}

export const aiService = new AIService();
