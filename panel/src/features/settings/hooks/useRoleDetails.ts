import { useQuery } from "@tanstack/react-query";
import type { RoleDetailsDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";

export function useRoleDetails(guildId: string, roleId: string) {
  return useQuery({
    queryKey: queryKeys.roleDetails(guildId, roleId),
    queryFn: () =>
      apiRequest<RoleDetailsDTO>(
        `/api/guilds/${guildId}/config/roles/${roleId}`,
      ),
    enabled: Boolean(roleId),
  });
}
