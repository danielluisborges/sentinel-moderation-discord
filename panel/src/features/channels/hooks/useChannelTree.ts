import { useQuery } from "@tanstack/react-query";
import type { ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";

export function useChannelTree(guildId: string) {
  return useQuery({
    queryKey: queryKeys.channels(guildId),
    queryFn: () =>
      apiRequest<ChannelTreeDTO>(`/api/guilds/${guildId}/channels`),
  });
}
