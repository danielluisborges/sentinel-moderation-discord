import { Power } from "lucide-react";
import { ToggleSwitch } from "../../../components/ui/ToggleSwitch.js";

export interface CommandRowData {
  name: string;
  description: string;
  enabled: boolean;
}

export function CommandRow({
  command,
  pending,
  onToggle,
}: {
  command: CommandRowData;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-800/70 text-slate-300">
        <Power size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100">/{command.name}</p>
        <p className="text-xs text-slate-500">{command.description}</p>
      </div>
      <span className={`text-xs ${command.enabled ? "text-emerald-300" : "text-slate-500"}`}>
        {command.enabled ? "Ativo" : "Desativado"}
      </span>
      <ToggleSwitch
        checked={command.enabled}
        onChange={onToggle}
        label={`${command.enabled ? "Desativar" : "Ativar"} /${command.name}`}
        disabled={pending}
      />
    </li>
  );
}
