import { Router } from "express";
import { z } from "zod";
import { client } from "../../client.js";
import type {
  ChannelPositionUpdate,
  ChannelStructureChannel,
  ChannelStructurePlan,
  CreateChannelRequest,
  UpdateChannelRequest,
} from "../../shared/dto.js";
import { channelsService } from "../../services/channels.service.js";
import { aiService, AIServiceError } from "../../services/ai.service.js";
import { requireGuildAccess } from "../middleware/requireGuildAccess.js";
import { snowflakeSchema } from "../http/schemas.js";
import { withGuild, withGuildExecutor } from "../http/guildContext.js";
import { sendRouteError } from "../http/errors.js";

export const channelsRouter = Router({ mergeParams: true });
channelsRouter.use(...requireGuildAccess);
const channelActionError = {
  status: 400,
  message: "O Sentinel não conseguiu aplicar essa alteração de canal.",
  logMessage: "Falha ao aplicar alteração de canal pelo painel",
};
const channelKindSchema = z.enum([
  "text",
  "voice",
  "stage",
  "category",
  "announcement",
  "forum",
]);
const createSchema: z.ZodType<CreateChannelRequest> = z.object({
  name: z.string().trim().min(1).max(100),
  type: channelKindSchema,
  visibility: z.enum(["public", "moderators"]),
  parentId: snowflakeSchema.nullable().optional(),
  topic: z.string().trim().max(1024).optional(),
});
const updateSchema: z.ZodType<UpdateChannelRequest> = z.object({
  name: z.string().trim().min(1).max(100),
  topic: z.string().trim().max(1024).optional(),
});
const reorderSchema: z.ZodType<ChannelPositionUpdate[]> = z
  .array(
    z.object({
      id: snowflakeSchema,
      position: z.number().int().min(0).max(499),
      parentId: snowflakeSchema.nullable(),
    }),
  )
  .min(1)
  .max(500);
const structureChannelSchema: z.ZodType<ChannelStructureChannel> = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["text", "voice", "stage", "announcement", "forum"]),
  visibility: z.enum(["public", "moderators"]),
  topic: z.string().trim().max(1024).optional(),
});
const structurePlanSchema: z.ZodType<ChannelStructurePlan> = z
  .object({
    categories: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(100),
          visibility: z.enum(["public", "moderators"]),
          channels: z.array(structureChannelSchema).max(15),
        }),
      )
      .max(8),
    channels: z.array(structureChannelSchema).max(30),
  })
  .superRefine((plan, context) => {
    const totalChannels =
      plan.channels.length +
      plan.categories.reduce(
        (total, category) => total + category.channels.length,
        0,
      );
    if (totalChannels === 0) {
      context.addIssue({
        code: "custom",
        message: "A estrutura precisa ter pelo menos um canal.",
      });
    }
    if (totalChannels > 30) {
      context.addIssue({
        code: "custom",
        message: "A estrutura pode criar no máximo 30 canais por vez.",
      });
    }
  });

channelsRouter.post("/ai/structure", async (req, res) => {
  const description = z
    .string()
    .trim()
    .min(5)
    .max(1200)
    .safeParse(req.body?.description);
  if (!description.success) {
    res
      .status(400)
      .json({ error: "Descreva a estrutura em até 1200 caracteres." });
    return;
  }
  const session = res.locals.sentinelSession;
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada." });
    return;
  }
  const guild = client.guilds.cache.get(res.locals.guildId);
  if (!guild) {
    res.status(404).json({ error: "Servidor não encontrado pelo Sentinel." });
    return;
  }
  const supportsAnnouncementChannels = guild.features.includes("NEWS");
  try {
    const rawPlan = await aiService.generateChannelStructure(
      session.userId,
      `${description.data}\n\nCompatibilidade deste servidor: ${supportsAnnouncementChannels ? "canais de anúncio estão disponíveis" : "canais de anúncio não estão disponíveis; use canais de texto comuns no lugar"}.`,
    );
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawPlan) as unknown;
    } catch {
      res.status(502).json({
        error: "A IA não retornou um JSON válido. Tente gerar novamente.",
      });
      return;
    }
    const plan = structurePlanSchema.safeParse(parsedJson);
    if (!plan.success) {
      res.status(502).json({
        error:
          "A IA retornou uma estrutura fora do formato esperado. Tente gerar novamente.",
      });
      return;
    }
    res.json({ plan: plan.data });
  } catch (error) {
    if (error instanceof AIServiceError) {
      sendRouteError(res, error, {
        status: 503,
        message: error.message,
        logMessage: "Falha ao gerar estrutura de canais com Gemini",
        context: { guildId: guild.id },
      });
      return;
    }
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível gerar a estrutura com IA.",
      logMessage: "Falha ao gerar estrutura de canais com IA",
      context: { guildId: guild.id },
    });
  }
});

channelsRouter.post("/ai/apply", async (req, res) => {
  const plan = structurePlanSchema.safeParse(req.body?.plan);
  if (!plan.success) {
    res.status(400).json({
      error: "O JSON da estrutura está inválido ou excede os limites.",
    });
    return;
  }
  await withGuildExecutor(
    res,
    async (guild, executor) => {
      res.json(
        await channelsService.createStructure(guild, executor, plan.data),
      );
    },
    channelActionError,
  );
});

channelsRouter.get("/", async (_req, res) => {
  try {
    await withGuild(res, async (guild) => {
      res.json(await channelsService.list(guild));
    });
  } catch (error) {
    sendRouteError(res, error, {
      status: 503,
      message: "Não foi possível carregar os canais.",
      logMessage: "Falha ao carregar canais do servidor",
      context: { guildId: String(res.locals.guildId) },
    });
  }
});

channelsRouter.post("/positions", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "A lista de posições dos canais é inválida." });
    return;
  }
  await withGuildExecutor(
    res,
    async (guild, executor) => {
      await channelsService.reorder(guild, executor, parsed.data);
      res.status(204).end();
    },
    channelActionError,
  );
});

channelsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Confira o nome, tipo, categoria e tópico do canal." });
    return;
  }
  await withGuildExecutor(
    res,
    async (guild, executor) => {
      const channel = await channelsService.create(
        guild,
        executor,
        parsed.data,
      );
      res.status(201).json(channel);
    },
    channelActionError,
  );
});

channelsRouter.patch("/:channelId", async (req, res) => {
  const parsedId = snowflakeSchema.safeParse(req.params.channelId);
  const parsedBody = updateSchema.safeParse(req.body);
  if (!parsedId.success || !parsedBody.success) {
    res.status(400).json({ error: "Confira o ID, nome e tópico do canal." });
    return;
  }
  await withGuildExecutor(
    res,
    async (guild, executor) => {
      res.json(
        await channelsService.update(
          guild,
          executor,
          parsedId.data,
          parsedBody.data,
        ),
      );
    },
    channelActionError,
  );
});

channelsRouter.delete("/:channelId", async (req, res) => {
  const parsedId = snowflakeSchema.safeParse(req.params.channelId);
  if (!parsedId.success) {
    res.status(400).json({ error: "ID de canal inválido." });
    return;
  }
  await withGuildExecutor(
    res,
    async (guild, executor) => {
      await channelsService.delete(guild, executor, parsedId.data);
      res.status(204).end();
    },
    channelActionError,
  );
});
