import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../api/queryKeys.js";
import { apiRequest } from "../../../api/client.js";
import type { ModerationAction } from "../lib/moderationActions.js";

export interface ModerationPayload {
  action: ModerationAction;
  userId: string;
  reason?: string;
  durationMinutes?: number;
}

export function useModerationAction(
  guildId: string,
  onSuccess: (action: ModerationAction) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: "Ação de moderação aplicada." },
    mutationFn: (payload: ModerationPayload) =>
      apiRequest<void>(`/api/guilds/${guildId}/moderation/actions`, {
        method: "POST",
        body: JSON.stringify({
          action: payload.action,
          userId: payload.userId,
          reason: payload.reason?.trim() || undefined,
          ...(payload.action === "timeout"
            ? { durationMinutes: payload.durationMinutes }
            : {}),
        }),
      }),
    onSuccess: async (_data, payload) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.members(guildId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bans(guildId) });
      onSuccess(payload.action);
    },
  });
}
