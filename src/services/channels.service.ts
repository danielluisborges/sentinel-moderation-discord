import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type NonThreadGuildBasedChannel,
  type TextChannel,
} from "discord.js";
import type {
  ChannelDTO,
  ChannelPositionUpdate,
  ChannelStructurePlan,
  ChannelTreeDTO,
  CreateChannelRequest,
  UpdateChannelRequest,
} from "../shared/dto.js";
import { configService } from "./config.service.js";
import { loggerService } from "./logger.service.js";
import type { LoggerService } from "./logger.service.js";
import { ModerationError } from "../utils/permissions.js";
import {
  channelToDto,
  discordType,
  listChannels,
  supportedChannelTypes,
} from "./channels/channelTree.js";
import {
  resolveModeratorRole,
  visibilityOverwrites,
} from "./channels/channelPermissions.js";
import { reorderChannels } from "./channels/channelReorder.js";
import { createChannelStructure } from "./channels/channelStructure.js";

/** Stable service facade retained for the web routes and existing integrations. */
export class ChannelsService {
  constructor(private readonly logs: LoggerService = loggerService) {}

  list(guild: Guild): Promise<ChannelTreeDTO> {
    return listChannels(guild);
  }

  async create(
    guild: Guild,
    executor: GuildMember,
    input: CreateChannelRequest,
  ): Promise<ChannelDTO> {
    const logChannel = await this.prepareAction(guild, executor);
    const parent = await this.resolveParent(guild, input.parentId ?? null);
    if (input.type === "category" && parent) {
      throw new ModerationError(
        "Categorias não podem ficar dentro de outra categoria.",
      );
    }
    const permissionOverwrites = await visibilityOverwrites(
      guild,
      input.visibility,
    );
    const created = await guild.channels.create({
      name: input.name,
      type: discordType(input.type),
      ...(parent ? { parent } : {}),
      permissionOverwrites,
      ...(input.topic && input.type !== "voice" && input.type !== "category"
        ? { topic: input.topic }
        : {}),
    });
    await this.logs.logChannelAction(logChannel, guild, {
      action: input.type === "category" ? "category_created" : "created",
      executor,
      ...(input.type === "category"
        ? { categoryName: created.name }
        : { channelName: created.name }),
      details: {
        ...(input.type === "category" ? {} : { Tipo: input.type }),
        ...(parent ? { Categoria: parent.name } : {}),
      },
    });
    return channelToDto(created);
  }

  createStructure(
    guild: Guild,
    executor: GuildMember,
    plan: ChannelStructurePlan,
  ): Promise<ChannelTreeDTO> {
    return createChannelStructure(guild, executor, plan, {
      prepareAction: (targetGuild, targetExecutor) =>
        this.prepareAction(targetGuild, targetExecutor),
      resolveModeratorRole,
      create: (targetGuild, targetExecutor, input) =>
        this.create(targetGuild, targetExecutor, input),
      list: (targetGuild) => this.list(targetGuild),
    });
  }

  async update(
    guild: Guild,
    executor: GuildMember,
    channelId: string,
    input: UpdateChannelRequest,
  ): Promise<ChannelDTO> {
    const logChannel = await this.prepareAction(guild, executor);
    const channel = await this.resolveChannel(guild, channelId);
    if (
      input.topic !== undefined &&
      ![
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildForum,
        ChannelType.GuildMedia,
      ].includes(channel.type)
    ) {
      throw new ModerationError("Este tipo de canal não aceita tópico.");
    }
    const before = channel.name;
    const updated = await channel.edit({
      name: input.name,
      ...(input.topic !== undefined ? { topic: input.topic || null } : {}),
    });
    await this.logs.logChannelAction(logChannel, guild, {
      action: "updated",
      executor,
      channelName: updated.name,
      details: {
        Alteração:
          before === updated.name
            ? "Tópico atualizado"
            : `Nome: ${before} → ${updated.name}`,
      },
    });
    return channelToDto(updated);
  }

  async delete(
    guild: Guild,
    executor: GuildMember,
    channelId: string,
  ): Promise<void> {
    const logChannel = await this.prepareAction(guild, executor);
    const channel = await this.resolveChannel(guild, channelId);
    const config = await configService.getGuildConfig(guild.id);
    if (config.logChannelId === channel.id) {
      throw new ModerationError(
        "Não é possível apagar o canal privado de logs configurado.",
      );
    }
    if (
      channel.type === ChannelType.GuildCategory &&
      channel.children.cache.size > 0
    ) {
      throw new ModerationError(
        "Mova ou apague os canais da categoria antes de apagá-la.",
      );
    }
    const channelName = channel.name;
    await channel.delete("Removido pelo painel do Sentinel");
    await this.logs.logChannelAction(logChannel, guild, {
      action: "deleted",
      executor,
      channelName,
    });
  }

  async reorder(
    guild: Guild,
    executor: GuildMember,
    updates: ChannelPositionUpdate[],
  ): Promise<void> {
    const logChannel = await this.prepareAction(guild, executor);
    await reorderChannels(guild, executor, updates, logChannel, this.logs);
  }

  private async prepareAction(
    guild: Guild,
    executor: GuildMember,
  ): Promise<TextChannel> {
    if (executor.guild.id !== guild.id) {
      throw new ModerationError(
        "O executor precisa pertencer a este servidor.",
      );
    }
    if (
      !executor.permissions.has(PermissionFlagsBits.Administrator) &&
      !executor.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      throw new ModerationError(
        "Você precisa da permissão Gerenciar Canais para editar os canais.",
      );
    }
    const botMember = guild.members.me ?? (await guild.members.fetchMe());
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new ModerationError(
        "O Sentinel precisa da permissão Gerenciar Canais.",
      );
    }
    return this.logs.prepareLogChannel(guild);
  }

  private async resolveChannel(
    guild: Guild,
    id: string,
  ): Promise<NonThreadGuildBasedChannel> {
    const channel = await guild.channels.fetch(id);
    if (!channel || !supportedChannelTypes.has(channel.type)) {
      throw new ModerationError(
        "Canal não encontrado neste servidor ou tipo não suportado.",
      );
    }
    return channel as NonThreadGuildBasedChannel;
  }

  private async resolveParent(guild: Guild, parentId: string | null) {
    if (!parentId) return null;
    const parent = await this.resolveChannel(guild, parentId);
    if (parent.type !== ChannelType.GuildCategory) {
      throw new ModerationError("Selecione uma categoria válida.");
    }
    return parent;
  }
}

export const channelsService = new ChannelsService();
