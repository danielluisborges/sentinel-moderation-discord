import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RolePermission } from "../../../../../src/shared/rolePermissions.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";

export interface CreateRolePayload {
  name: string;
  color: string;
  permissions: RolePermission[];
  hoist: boolean;
  mentionable: boolean;
  reason?: string;
}

export function useRoleMutations(
  guildId: string,
  roleId: string,
  onCreated?: (roleId: string) => void,
  onRemoved?: () => void,
  onRevoked?: () => void,
) {
  const queryClient = useQueryClient();
  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.settings(guildId) });

  const create = useMutation({
    meta: { successMessage: "Cargo criado e registrado nos logs." },
    mutationFn: (payload: CreateRolePayload) =>
      apiRequest<{ id: string; name: string }>(
        `/api/guilds/${guildId}/config/roles`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: async (role) => {
      onCreated?.(role.id);
      await invalidateSettings();
    },
  });

  const revoke = useMutation({
    meta: { successMessage: "Cargo revogado e registrado nos logs." },
    mutationFn: (userId: string) =>
      apiRequest<void>(
        `/api/guilds/${guildId}/config/roles/${roleId}/members/${userId}`,
        { method: "DELETE" },
      ),
    onSuccess: async () => {
      onRevoked?.();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.roleDetails(guildId, roleId),
      });
    },
  });

  const remove = useMutation({
    meta: { successMessage: "Cargo excluído e registrado nos logs." },
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/guilds/${guildId}/config/roles/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: "Excluído pelo painel de configurações" }),
      }),
    onSuccess: async () => {
      onRemoved?.();
      await Promise.all([
        invalidateSettings(),
        queryClient.invalidateQueries({ queryKey: queryKeys.roleDetails(guildId) }),
      ]);
    },
  });

  return { create, revoke, remove };
}
