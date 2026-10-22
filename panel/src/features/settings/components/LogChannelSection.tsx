import { selectClass } from "../../../components/ui/formStyles.js";

export function LogChannelSection({
  channels,
  channelId,
  onChange,
}: {
  channels: Array<{ id: string; name: string }>;
  channelId: string;
  onChange: (channelId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <h2 className="font-semibold text-slate-100">Canal de logs</h2>
      <label
        className="mt-4 block text-sm text-slate-300"
        htmlFor="log-channel"
      >
        Canal privado
      </label>
      <select
        id="log-channel"
        value={channelId}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        <option value="">Criar ou preparar automaticamente</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Só aparecem canais de texto privados para @everyone. Se deixar no
        automático, o Sentinel prepara o canal #sentinel-logs quando precisar
        registrar uma ação.
      </p>
    </section>
  );
}
