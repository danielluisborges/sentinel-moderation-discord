import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommandSettingsDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";

export function useCommands(guildId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["commands", guildId],
    queryFn: () =>
      apiRequest<CommandSettingsDTO>(`/api/guilds/${guildId}/config/commands`),
  });
  const toggle = useMutation({
    meta: { successMessage: "Estado do comando atualizado." },
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      apiRequest<void>(
        `/api/guilds/${guildId}/config/commands/${encodeURIComponent(name)}`,
        { method: "PATCH", body: JSON.stringify({ enabled }) },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commands", guildId] });
    },
  });

  return { query, toggle };
}
