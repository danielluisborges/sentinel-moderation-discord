import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import type { GuildSettingsDTO } from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { buttonClass } from "../../../components/ui/formStyles.js";
import { LogChannelSection } from "./LogChannelSection.js";
import { ModerationSettingsSection } from "./ModerationSettingsSection.js";

export function GuildSettingsForm({
  guildId,
  initial,
  children,
}: {
  guildId: string;
  initial: GuildSettingsDTO;
  children: ReactNode;
}) {
  const [form, setForm] = useState(() => ({
    modRoleId: initial.modRoleId ?? "",
    logChannelId: initial.logChannelId ?? "",
  }));
  const queryClient = useQueryClient();
  const save = useMutation({
    meta: { successMessage: "Configurações salvas." },
    mutationFn: () =>
      apiRequest<void>(`/api/guilds/${guildId}/config`, {
        method: "PATCH",
        body: JSON.stringify({
          modRoleId: form.modRoleId || null,
          logChannelId: form.logChannelId || null,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings(guildId) });
    },
  });

  return (
    <>
      <ModerationSettingsSection
        roles={initial.roles}
        modRoleId={form.modRoleId}
        onChange={(modRoleId) => setForm((current) => ({ ...current, modRoleId }))}
      />
      {children}
      <LogChannelSection
        channels={initial.textChannels}
        channelId={form.logChannelId}
        onChange={(logChannelId) => setForm((current) => ({ ...current, logChannelId }))}
      />
      {save.isError && <PanelMessage tone="error">{save.error.message}</PanelMessage>}
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className={buttonClass}
      >
        {save.isPending ? "Salvando…" : "Salvar configurações"}
      </button>
    </>
  );
}
