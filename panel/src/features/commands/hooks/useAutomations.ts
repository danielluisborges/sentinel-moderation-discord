import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutomationSettingsDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";

export interface AutomationFormState {
  welcomeEnabled: boolean;
  welcomeChannelId: string;
  welcomeMessage: string;
  leaveEnabled: boolean;
  leaveChannelId: string;
  leaveMessage: string;
}

export function useAutomations(guildId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["automations", guildId],
    queryFn: () =>
      apiRequest<AutomationSettingsDTO>(
        `/api/guilds/${guildId}/config/automations`,
      ),
  });
  const save = useMutation({
    meta: { successMessage: "Mensagens automáticas salvas." },
    mutationFn: (form: AutomationFormState) =>
      apiRequest<void>(`/api/guilds/${guildId}/config/automations`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          welcomeChannelId: form.welcomeChannelId || null,
          leaveChannelId: form.leaveChannelId || null,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["automations", guildId],
      });
    },
  });

  return { query, save };
}
