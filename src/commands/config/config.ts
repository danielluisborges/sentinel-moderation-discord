import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/command.js";
import { configService } from "../../services/config.service.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configura as opções do Sentinel neste servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("canal-logs")
        .setDescription("Define o canal de registros de moderação.")
        .addChannelOption((option) =>
          option
            .setName("canal")
            .setDescription("Canal de texto para os registros.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cargo-mod")
        .setDescription("Define o cargo de moderador do Sentinel.")
        .addRoleOption((option) =>
          option
            .setName("cargo")
            .setDescription("Cargo que poderá usar os recursos de moderação.")
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    const guild = interaction.guild;
    if (!interaction.inGuild() || !interaction.guildId || !guild) {
      await interaction.reply({
        content: "Este comando só pode ser usado em um servidor.",
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: "Você precisa ser administrador para alterar a configuração.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "canal-logs") {
      const selectedChannel = interaction.options.getChannel("canal", true);
      const channel = await guild.channels.fetch(selectedChannel.id);
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "Escolha um canal de texto deste servidor.",
          ephemeral: true,
        });
        return;
      }

      const everyoneCanView = channel
        .permissionsFor(guild.roles.everyone)
        .has(PermissionFlagsBits.ViewChannel);
      if (everyoneCanView) {
        await interaction.reply({
          content: "O canal de logs precisa ser privado para @everyone.",
          ephemeral: true,
        });
        return;
      }

      const botMember = guild.members.me;
      const botPermissions = botMember
        ? channel.permissionsFor(botMember)
        : null;
      if (
        !botPermissions?.has([
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
        ])
      ) {
        await interaction.reply({
          content:
            "O Sentinel precisa poder ver o canal, enviar mensagens e incorporar links nele.",
          ephemeral: true,
        });
        return;
      }

      await configService.setLogChannel(interaction.guildId, channel.id);
      await interaction.reply({
        content: `Canal de logs definido como <#${channel.id}>.`,
        ephemeral: true,
      });
      return;
    }

    const selectedRole = interaction.options.getRole("cargo", true);
    const role = await guild.roles.fetch(selectedRole.id);
    if (!role || role.id === interaction.guildId) {
      await interaction.reply({
        content:
          "Escolha um cargo válido deste servidor, diferente de @everyone.",
        ephemeral: true,
      });
      return;
    }

    await configService.setModRole(interaction.guildId, role.id);
    await interaction.reply({
      content: `Cargo de moderador definido como <@&${role.id}>.`,
      ephemeral: true,
    });
  },
};

export default command;
