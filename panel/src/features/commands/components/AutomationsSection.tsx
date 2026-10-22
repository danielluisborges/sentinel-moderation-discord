import { useState } from "react";
import { MessageSquareText, Save } from "lucide-react";
import type { AutomationSettingsDTO } from "../../../../../src/shared/dto.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { buttonClass } from "../../../components/ui/formStyles.js";
import type { AutomationFormState } from "../hooks/useAutomations.js";
import { AutomationForm } from "./AutomationForm.js";

function toFormState(settings: AutomationSettingsDTO): AutomationFormState {
  return {
    welcomeEnabled: settings.welcomeEnabled,
    welcomeChannelId: settings.welcomeChannelId ?? "",
    welcomeMessage: settings.welcomeMessage,
    leaveEnabled: settings.leaveEnabled,
    leaveChannelId: settings.leaveChannelId ?? "",
    leaveMessage: settings.leaveMessage,
  };
}

export function AutomationsSection({
  initial,
  save,
}: {
  initial: AutomationSettingsDTO;
  save: {
    mutate: (form: AutomationFormState) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
}) {
  const [form, setForm] = useState(() => toFormState(initial));
  const update = (patch: Partial<AutomationFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><MessageSquareText size={19} /></span>
        <div>
          <h2 className="font-semibold text-slate-100">Mensagens automáticas</h2>
          <p className="mt-1 text-sm text-slate-400">Envie uma mensagem quando alguém entrar ou sair do servidor.</p>
        </div>
      </div>

      <div className="space-y-6">
        <AutomationForm
          title="Boas-vindas"
          value={{ enabled: form.welcomeEnabled, channelId: form.welcomeChannelId, message: form.welcomeMessage }}
          onChange={(value) => update({ welcomeEnabled: value.enabled, welcomeChannelId: value.channelId, welcomeMessage: value.message })}
          channels={initial.textChannels}
          placeholder="Boas-vindas, {user}! Você chegou ao {server}."
        />
        <div className="border-t border-slate-800" />
        <AutomationForm
          title="Mensagem de saída"
          value={{ enabled: form.leaveEnabled, channelId: form.leaveChannelId, message: form.leaveMessage }}
          onChange={(value) => update({ leaveEnabled: value.enabled, leaveChannelId: value.channelId, leaveMessage: value.message })}
          channels={initial.textChannels}
          placeholder="{username} saiu do {server}."
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Variáveis disponíveis: <code>{"{user}"}</code> menciona a pessoa, <code>{"{username}"}</code> mostra o nome, <code>{"{server}"}</code> o servidor e <code>{"{memberCount}"}</code> a quantidade de membros.
      </p>
      {save.isError && (
        <div className="mt-4"><PanelMessage tone="error">{save.error?.message ?? "Não foi possível salvar as automações."}</PanelMessage></div>
      )}
      <button
        type="button"
        onClick={() => save.mutate(form)}
        disabled={save.isPending}
        className={`${buttonClass} mt-5 inline-flex items-center gap-2`}
      >
        <Save size={16} />
        {save.isPending ? "Salvando…" : "Salvar automações"}
      </button>
    </section>
  );
}
