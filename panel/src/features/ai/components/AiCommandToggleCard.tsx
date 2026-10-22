import { Bot } from "lucide-react";
import type { GuildSettingsDTO } from "../../../../../src/shared/dto.js";
import { buttonClass } from "../../../components/ui/formStyles.js";

export function AiCommandToggleCard({
  settings,
  pending,
  onToggle,
}: {
  settings: GuildSettingsDTO;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
          <Bot size={19} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-100">Comando /prompt</h2>
          <p className="mt-1 text-sm text-slate-400">
            {settings.aiEnabled ? "Ativo neste servidor" : "Desativado neste servidor"}
          </p>
        </div>
      </div>
      <button type="button" disabled={pending} onClick={onToggle} className={buttonClass}>
        {pending ? "Salvando…" : settings.aiEnabled ? "Desativar IA" : "Ativar IA"}
      </button>
    </section>
  );
}
