import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ChannelDTO,
  ChannelPositionUpdate,
} from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";
import type { ChannelForm } from "../lib/types.js";

export function useChannelMutations(
  guildId: string,
  selectedChannel: ChannelDTO | undefined,
  onCreated: (channel: ChannelDTO) => void,
  onUpdated: () => void,
  onRemoved: () => void,
) {
  const queryClient = useQueryClient();
  const invalidateChannels = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.channels(guildId) });

  const save = useMutation({
    meta: { successMessage: "Ordem dos canais salva e registrada nos logs." },
    mutationFn: (updates: ChannelPositionUpdate[]) =>
      apiRequest<void>(`/api/guilds/${guildId}/channels/positions`, {
        method: "POST",
        body: JSON.stringify(updates),
      }),
    onSuccess: invalidateChannels,
  });

  const create = useMutation({
    meta: {
      successMessage: "Canal ou categoria criado e registrado nos logs.",
    },
    mutationFn: (payload: ChannelForm) =>
      apiRequest<ChannelDTO>(`/api/guilds/${guildId}/channels`, {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          type: payload.type,
          visibility: payload.visibility,
          parentId: payload.parentId || null,
          ...(payload.topic.trim() ? { topic: payload.topic.trim() } : {}),
        }),
      }),
    onSuccess: async (channel) => {
      onCreated(channel);
      await invalidateChannels();
    },
  });

  const update = useMutation({
    meta: { successMessage: "Canal atualizado e registrado nos logs." },
    mutationFn: (payload: ChannelForm) =>
      apiRequest<ChannelDTO>(
        `/api/guilds/${guildId}/channels/${selectedChannel?.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: payload.name,
            ...(payload.topic !== (selectedChannel?.topic ?? "")
              ? { topic: payload.topic }
              : {}),
          }),
        },
      ),
    onSuccess: async () => {
      onUpdated();
      await invalidateChannels();
    },
  });

  const remove = useMutation({
    meta: { successMessage: "Canal removido e registrado nos logs." },
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/guilds/${guildId}/channels/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      onRemoved();
      await invalidateChannels();
    },
  });

  return { save, create, update, remove };
}
