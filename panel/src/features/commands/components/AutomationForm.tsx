import type { AutomationSettingsDTO } from "../../../../../src/shared/dto.js";
import { ToggleSwitch } from "../../../components/ui/ToggleSwitch.js";
import { selectClass } from "../../../components/ui/formStyles.js";

export interface AutomationMessageFormValue {
  enabled: boolean;
  channelId: string;
  message: string;
}

export function AutomationForm({
  title,
  value,
  onChange,
  channels,
  placeholder,
}: {
  title: string;
  value: AutomationMessageFormValue;
  onChange: (value: AutomationMessageFormValue) => void;
  channels: AutomationSettingsDTO["textChannels"];
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{value.enabled ? "Ativada" : "Desativada"}</p>
        </div>
        <ToggleSwitch
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
          label={`${value.enabled ? "Desativar" : "Ativar"} ${title.toLowerCase()}`}
        />
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Canal
          <select
            value={value.channelId}
            onChange={(event) => onChange({ ...value, channelId: event.target.value })}
            className={selectClass}
          >
            <option value="">Selecione um canal</option>
            {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Mensagem
          <textarea
            value={value.message}
            onChange={(event) => onChange({ ...value, message: event.target.value })}
            maxLength={2000}
            rows={3}
            placeholder={placeholder}
            className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none focus:border-blue-400"
          />
        </label>
      </div>
    </div>
  );
}
