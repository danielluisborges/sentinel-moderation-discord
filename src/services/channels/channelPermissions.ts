import { PermissionFlagsBits, type Guild } from "discord.js";
import type { CreateChannelRequest } from "../../shared/dto.js";
import { configService } from "../config.service.js";
import { ModerationError } from "../../utils/permissions.js";

export async function visibilityOverwrites(
  guild: Guild,
  visibility: CreateChannelRequest["visibility"],
) {
  if (visibility === "public") {
    return [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ];
  }

  const moderatorRole = await resolveModeratorRole(guild);
  const botMember = guild.members.me ?? (await guild.members.fetchMe());
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: moderatorRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
      ],
    },
    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
      ],
    },
  ];
}

export async function resolveModeratorRole(guild: Guild) {
  const config = await configService.getGuildConfig(guild.id);
  if (!config.modRoleId) {
    throw new ModerationError(
      "Configure o cargo de moderador com /config cargo-mod antes de criar canais privados.",
    );
  }
  const moderatorRole = await guild.roles.fetch(config.modRoleId);
  if (!moderatorRole || moderatorRole.id === guild.roles.everyone.id) {
    throw new ModerationError(
      "O cargo de moderador configurado não existe mais. Configure-o novamente com /config cargo-mod.",
    );
  }
  return moderatorRole;
}
