import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
} from "discord.js";
import { ModerationError } from "../../utils/permissions.js";

export async function getModerationContext(
  interaction: ChatInputCommandInteraction,
): Promise<{ guild: Guild; executor: GuildMember }> {
  const guild = interaction.guild;
  if (!interaction.inGuild() || !guild) {
    throw new ModerationError("Este comando só pode ser usado em um servidor.");
  }
  const executor = await guild.members.fetch(interaction.user.id);
  return { guild, executor };
}

export async function replyPrivately(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  await interaction.reply({ content, ephemeral: true });
}
