import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Mostra informações públicas de um usuário.")
    .addUserOption((option) =>
      option.setName("usuario").setDescription("Usuário a consultar."),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("usuario") ?? interaction.user;
    const guild = interaction.guild;
    const member = guild
      ? await guild.members.fetch(user.id).catch(() => null)
      : null;
    const roleList = member
      ? member.roles.cache
          .filter((role) => role.id !== guild?.id)
          .map((role) => `<@&${role.id}>`)
          .slice(0, 20)
          .join(", ") || "Nenhum cargo"
      : null;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`Informações de ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "ID", value: user.id, inline: true },
        {
          name: "Conta criada",
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
          inline: true,
        },
      );

    if (member) {
      embed.addFields(
        {
          name: "Entrou no servidor",
          value: member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : "Não disponível",
          inline: true,
        },
        { name: "Cargos", value: roleList ?? "Nenhum cargo" },
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
