import { Bot } from "lucide-react";
import type { CommandSettingsDTO } from "../../../../../src/shared/dto.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { CommandRow } from "./CommandRow.js";

export function CommandList({
  data,
  error,
  pending,
  onToggle,
}: {
  data: CommandSettingsDTO;
  error?: string;
  pending: boolean;
  onToggle: (name: string, enabled: boolean) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300"><Bot size={19} /></span>
        <div>
          <h2 className="font-semibold text-slate-100">Comandos</h2>
          <p className="mt-1 text-sm text-slate-400">Desative comandos individualmente neste servidor. A mudança não afeta outros servidores.</p>
        </div>
      </div>
      {error && <PanelMessage tone="error">{error}</PanelMessage>}
      <ul className="divide-y divide-slate-800">
        {data.commands.map((command) => (
          <CommandRow
            key={command.name}
            command={command}
            pending={pending}
            onToggle={() => onToggle(command.name, !command.enabled)}
          />
        ))}
      </ul>
    </section>
  );
}
