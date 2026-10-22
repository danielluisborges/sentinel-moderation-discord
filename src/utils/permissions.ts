import {
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type PermissionResolvable,
} from "discord.js";
import type { GuildConfig } from "../types/config.js";

export class ModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModerationError";
  }
}

interface ModerationAccessOptions {
  guild: Guild;
  executor: GuildMember;
  config: GuildConfig;
  requiredPermission: PermissionResolvable;
  target?: GuildMember;
}

export async function assertModerationAccess({
  guild,
  executor,
  config,
  requiredPermission,
  target,
}: ModerationAccessOptions): Promise<GuildMember> {
  const isAdministrator = executor.permissions.has(
    PermissionFlagsBits.Administrator,
  );
  const hasModeratorRole =
    config.modRoleId !== null && executor.roles.cache.has(config.modRoleId);

  if (!isAdministrator && !hasModeratorRole) {
    throw new ModerationError(
      "Você precisa do cargo de moderador configurado para usar esta ação.",
    );
  }

  if (!isAdministrator && !executor.permissions.has(requiredPermission)) {
    throw new ModerationError(
      "Você não tem a permissão necessária no Discord para esta ação.",
    );
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe());
  if (!botMember.permissions.has(requiredPermission)) {
    throw new ModerationError(
      "O Sentinel não tem a permissão necessária para executar esta ação.",
    );
  }

  if (target) {
    if (target.id === botMember.id) {
      throw new ModerationError(
        "O Sentinel não pode moderar a própria conta. Para removê-lo do servidor, use as configurações do servidor no Discord.",
      );
    }
    if (target.id === guild.ownerId) {
      throw new ModerationError(
        "O dono do servidor não pode ser moderado por este comando.",
      );
    }

    if (
      executor.id !== guild.ownerId &&
      executor.roles.highest.comparePositionTo(target.roles.highest) <= 0
    ) {
      throw new ModerationError(
        "O cargo do alvo está no mesmo nível ou acima do seu.",
      );
    }

    if (botMember.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
      throw new ModerationError(
        "O cargo do alvo está no mesmo nível ou acima do Sentinel.",
      );
    }
  }

  return botMember;
}
