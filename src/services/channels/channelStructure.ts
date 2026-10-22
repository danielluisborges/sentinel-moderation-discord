import type { Guild, GuildMember, Role, TextChannel } from "discord.js";
import type {
  ChannelDTO,
  ChannelStructurePlan,
  ChannelTreeDTO,
  CreateChannelRequest,
} from "../../shared/dto.js";
import { logger } from "../../logger.js";
import { ModerationError } from "../../utils/permissions.js";

interface ChannelStructureDependencies {
  prepareAction: (guild: Guild, executor: GuildMember) => Promise<TextChannel>;
  resolveModeratorRole: (guild: Guild) => Promise<Role>;
  create: (
    guild: Guild,
    executor: GuildMember,
    input: CreateChannelRequest,
  ) => Promise<ChannelDTO>;
  list: (guild: Guild) => Promise<ChannelTreeDTO>;
}

export async function createChannelStructure(
  guild: Guild,
  executor: GuildMember,
  plan: ChannelStructurePlan,
  dependencies: ChannelStructureDependencies,
): Promise<ChannelTreeDTO> {
  const hasAnnouncementChannels =
    plan.channels.some((channel) => channel.type === "announcement") ||
    plan.categories.some((category) =>
      category.channels.some((channel) => channel.type === "announcement"),
    );
  if (hasAnnouncementChannels && !guild.features.includes("NEWS")) {
    throw new ModerationError(
      "Este servidor não aceita canais de anúncios. Ative Comunidade nas configurações do Discord ou gere novamente a estrutura para usar canais de texto comuns.",
    );
  }

  const createdNames: string[] = [];
  await dependencies.prepareAction(guild, executor);
  const hasPrivateChannels =
    plan.channels.some((channel) => channel.visibility === "moderators") ||
    plan.categories.some(
      (category) =>
        category.visibility === "moderators" ||
        category.channels.some(
          (channel) => channel.visibility === "moderators",
        ),
    );
  if (hasPrivateChannels) await dependencies.resolveModeratorRole(guild);

  let currentItem = "a estrutura";
  try {
    for (const categoryPlan of plan.categories) {
      currentItem = `categoria “${categoryPlan.name}”`;
      const category = await dependencies.create(guild, executor, {
        name: categoryPlan.name,
        type: "category",
        visibility: categoryPlan.visibility,
        parentId: null,
      });
      createdNames.push(category.name);
      for (const channel of categoryPlan.channels) {
        currentItem = `canal “${channel.name}” na categoria “${category.name}”`;
        await dependencies.create(guild, executor, {
          ...channel,
          parentId: category.id,
        });
        createdNames.push(channel.name);
      }
    }
    for (const channel of plan.channels) {
      currentItem = `canal “${channel.name}”`;
      await dependencies.create(guild, executor, {
        ...channel,
        parentId: null,
      });
      createdNames.push(channel.name);
    }
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        err: error,
        guildId: guild.id,
        executorId: executor.id,
        item: currentItem,
        createdItems: createdNames,
      },
      "Falha ao criar estrutura de canais",
    );
    const failureMessage = `Falha ao criar ${currentItem}: ${cause}`;
    if (createdNames.length) {
      throw new ModerationError(
        `A estrutura foi criada parcialmente. Itens concluídos: ${createdNames.join(", ")}. ${failureMessage} Confira a lista de canais antes de tentar de novo.`,
      );
    }
    if (error instanceof ModerationError) throw error;
    throw new ModerationError(failureMessage);
  }
  return dependencies.list(guild);
}
