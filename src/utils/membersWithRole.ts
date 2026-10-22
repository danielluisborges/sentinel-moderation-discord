import type { Guild } from "discord.js";

/** Uses the REST member-list endpoint in pages, avoiding gateway opcode 8 limits. */
export async function fetchMembersWithRole(guild: Guild, roleId: string) {
  const matchingMembers = [];
  let after: string | undefined;

  while (true) {
    const page = await guild.members.list({
      limit: 1000,
      ...(after ? { after } : {}),
    });
    if (page.size === 0) break;

    for (const member of page.values()) {
      if (member.roles.cache.has(roleId)) matchingMembers.push(member);
    }

    const lastId = [...page.keys()].at(-1);
    if (page.size < 1000 || !lastId) break;
    after = lastId;
  }

  return matchingMembers;
}
