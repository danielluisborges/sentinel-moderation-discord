import type { GuildMember } from "discord.js";

export function renderMemberTemplate(
  template: string,
  member: GuildMember,
  memberCount = member.guild.memberCount,
): string {
  const values: Record<string, string> = {
    user: `<@${member.id}>`,
    username: member.user.username,
    server: member.guild.name,
    memberCount: String(memberCount),
  };
  return template.replace(
    /\{(user|username|server|memberCount)\}/g,
    (_, key: string) => values[key] ?? "",
  );
}
