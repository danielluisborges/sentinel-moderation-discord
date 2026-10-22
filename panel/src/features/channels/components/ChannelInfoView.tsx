import { Trash2 } from "lucide-react";
import type { ChannelDTO, ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { categoryName } from "../lib/channelTree.js";
import { labelFor, supportsTopic } from "../lib/channelMeta.js";

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={`max-w-[65%] break-all text-right text-sm text-slate-200 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ChannelInfoView({
  channel,
  tree,
  removing,
  onDelete,
}: {
  channel: ChannelDTO;
  tree: ChannelTreeDTO;
  removing: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="p-5">
        <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
          <InfoRow label="Nome do canal" value={channel.name} />
          {supportsTopic(channel.type) && (
            <InfoRow label="Tópico" value={channel.topic || "Sem tópico"} />
          )}
          {channel.type !== "category" && (
            <InfoRow
              label="Categoria"
              value={categoryName(tree, channel.parentId)}
            />
          )}
          <InfoRow label="Tipo" value={labelFor(channel.type)} />
        </div>
        <div className="mt-7 border-t border-slate-800 pt-5">
          <h3 className="mb-3 text-sm font-semibold">Informações</h3>
          <InfoRow label="ID do canal" value={channel.id} mono />
          <InfoRow label="Posição" value={String(channel.position + 1)} />
        </div>
        <button
          onClick={onDelete}
          disabled={removing}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/60 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {removing ? "Apagando…" : "Apagar canal"}
        </button>
      </div>
    </>
  );
}
