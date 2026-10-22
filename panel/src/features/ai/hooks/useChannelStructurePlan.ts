import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { ChannelStructurePlan, ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";

export function useChannelStructurePlan(
  guildId: string,
  onCreated: () => void,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createStructure = useMutation({
    meta: { successMessage: "Estrutura criada e registrada nos logs." },
    mutationFn: (plan: ChannelStructurePlan) =>
      apiRequest<ChannelTreeDTO>(`/api/guilds/${guildId}/channels/ai/apply`, {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: async () => {
      onCreated();
      await queryClient.invalidateQueries({ queryKey: ["channels", guildId] });
      navigate(`/guild/${guildId}/channels`);
    },
  });

  const generateStructure = useMutation({
    meta: {
      successMessage: "Estrutura gerada. Confira a prévia antes de aplicar.",
    },
    mutationFn: (description: string) =>
      apiRequest<{ plan: ChannelStructurePlan }>(
        `/api/guilds/${guildId}/channels/ai/structure`,
        { method: "POST", body: JSON.stringify({ description }) },
      ),
    onSuccess: () => {
      createStructure.reset();
    },
  });

  return { generateStructure, createStructure };
}
