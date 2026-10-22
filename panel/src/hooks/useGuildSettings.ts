import { useQuery } from "@tanstack/react-query";
import type { GuildSettingsDTO } from "../../../src/shared/dto.js";
import { apiRequest } from "../api/client.js";
import { queryKeys } from "../api/queryKeys.js";

export function useGuildSettings(guildId: string) {
  return useQuery({
    queryKey: queryKeys.settings(guildId),
    queryFn: () =>
      apiRequest<GuildSettingsDTO>(`/api/guilds/${guildId}/config`),
  });
}
