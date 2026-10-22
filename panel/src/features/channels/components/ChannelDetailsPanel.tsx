import { Pencil } from "lucide-react";
import type { ChannelDTO, ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { StatusView } from "../../../components/StatusView.js";
import type { ChannelForm } from "../lib/types.js";
import { iconFor, labelFor } from "../lib/channelMeta.js";
import { ChannelEditForm } from "./ChannelEditForm.js";
import { ChannelInfoView } from "./ChannelInfoView.js";

export function ChannelDetailsPanel({
  channel,
  tree,
  editing,
  form,
  updatePending,
  updateError,
  removePending,
  onEdit,
  onFormChange,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  channel?: ChannelDTO;
  tree: ChannelTreeDTO;
  editing: boolean;
  form: ChannelForm;
  updatePending: boolean;
  updateError?: string;
  removePending: boolean;
  onEdit: () => void;
  onFormChange: (form: ChannelForm) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521]">
      {channel ? (
        <>
          <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800 text-xl text-slate-300">
                {iconFor(channel.type)}
              </span>
              <div>
                <h2 className="font-semibold text-slate-100">{channel.name}</h2>
                <p className="text-xs text-slate-500">{labelFor(channel.type)}</p>
              </div>
            </div>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-500/10"
            >
              <Pencil size={15} />
              Editar
            </button>
          </header>
          {editing ? (
            <div className="p-5">
              <ChannelEditForm
                channel={channel}
                form={form}
                pending={updatePending}
                error={updateError}
                onChange={onFormChange}
                onCancel={onCancelEdit}
                onSubmit={onSave}
              />
            </div>
          ) : (
            <ChannelInfoView
              channel={channel}
              tree={tree}
              removing={removePending}
              onDelete={onDelete}
            />
          )}
        </>
      ) : (
        <div className="grid h-full min-h-[420px] place-items-center p-8">
          <StatusView title="Selecione um canal ou categoria">
            Os detalhes e as opções de edição aparecerão aqui.
          </StatusView>
        </div>
      )}
    </section>
  );
}
