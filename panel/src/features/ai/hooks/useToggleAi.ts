import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../../api/client.js";

export function useToggleAi(guildId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Configuração da IA salva." },
    mutationFn: (aiEnabled: boolean) =>
      apiRequest<void>(`/api/guilds/${guildId}/config`, {
        method: "PATCH",
        body: JSON.stringify({ aiEnabled }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", guildId] });
    },
  });
}
