import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { ApiError, retryOrLogin } from "../api/client.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { PageSkeleton } from "../components/Skeleton.js";
import { StatusView } from "../components/StatusView.js";
import { PageHeading } from "../components/ui/PageHeading.js";
import { ChannelDetailsPanel } from "../features/channels/components/ChannelDetailsPanel.js";
import { ChannelTreePanel } from "../features/channels/components/ChannelTreePanel.js";
import { CreateChannelDialog } from "../features/channels/components/CreateChannelDialog.js";
import { UnsavedChangesBar } from "../features/channels/components/UnsavedChangesBar.js";
import { useChannelDraft } from "../features/channels/hooks/useChannelDraft.js";
import { useChannelMutations } from "../features/channels/hooks/useChannelMutations.js";
import { useChannelSelection } from "../features/channels/hooks/useChannelSelection.js";
import { useChannelTree } from "../features/channels/hooks/useChannelTree.js";
import { toPositionUpdates } from "../features/channels/lib/channelTree.js";
import { emptyChannelForm } from "../features/channels/lib/types.js";
import type { ChannelForm, CreateDialogKind } from "../features/channels/lib/types.js";
import { useGuild } from "../hooks/useGuild.js";

export function ChannelsPage() {
  const guild = useGuild();
  const channels = useChannelTree(guild.id);
  const { draft, isDirty, onDragEnd, discard } = useChannelDraft(
    channels.data,
  );
  const activeTree = draft ?? channels.data;
  const { selected, setSelected, selectedChannel } = useChannelSelection(activeTree);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ChannelForm>(emptyChannelForm);
  const [dialog, setDialog] = useState<CreateDialogKind | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const mutations = useChannelMutations(
    guild.id,
    selectedChannel,
    (channel) => {
      setDialog(null);
      setForm(emptyChannelForm);
      setSelected({
        id: channel.id,
        kind: channel.type === "category" ? "category" : "channel",
      });
    },
    () => setEditing(false),
    () => {
      setSelected(null);
      setConfirmDelete(false);
    },
  );

  function openCreate(kind: CreateDialogKind) {
    setForm({
      ...emptyChannelForm,
      type: kind === "category" ? "category" : "text",
      visibility: "public",
      parentId:
        selected?.kind === "category" && kind === "channel" ? selected.id : "",
    });
    setDialog(kind);
    mutations.create.reset();
  }

  function beginEdit() {
    if (!selectedChannel) return;
    setForm({
      name: selectedChannel.name,
      type: selectedChannel.type,
      visibility: "public",
      parentId: selectedChannel.parentId ?? "",
      topic: selectedChannel.topic ?? "",
    });
    setEditing(true);
    mutations.update.reset();
  }

  return (
    <div className="relative pb-20">
      <PageHeading
        active="channels"
        guildId={guild.id}
        eyebrow={guild.name}
        title="Canais"
        description="Gerencie a estrutura de canais do servidor. Arraste e solte para reorganizar."
        showLinks={false}
      />
      <div className="absolute right-0 top-0 flex gap-2 max-sm:static max-sm:mb-4">
        <button
          onClick={() => openCreate("channel")}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
        >
          <Plus size={16} className="mr-1.5 inline" /> Criar canal
        </button>
        <button
          onClick={() => openCreate("category")}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          <Plus size={16} className="mr-1.5 inline" /> Criar categoria
        </button>
      </div>
      {channels.isPending && <PageSkeleton variant="channels" />}
      {channels.isError && (
        <StatusView title="Não foi possível carregar os canais">
          {channels.error.message}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => retryOrLogin(channels.error, channels.refetch)}
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              {channels.error instanceof ApiError && channels.error.status === 401
                ? "Entrar novamente"
                : "Tentar novamente"}
            </button>
          </div>
        </StatusView>
      )}
      {activeTree && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <div className="grid min-h-[620px] gap-3 xl:grid-cols-[252px_minmax(0,1fr)_320px]">
            <ChannelTreePanel
              tree={activeTree}
              selectedId={selected?.id}
              onSelect={(id, kind) => {
                setSelected({ id, kind });
                setEditing(false);
              }}
            />
            <ChannelDetailsPanel
              channel={selectedChannel}
              tree={activeTree}
              editing={editing}
              form={form}
              updatePending={mutations.update.isPending}
              updateError={mutations.update.isError ? mutations.update.error.message : undefined}
              removePending={mutations.remove.isPending}
              onEdit={beginEdit}
              onFormChange={setForm}
              onCancelEdit={() => setEditing(false)}
              onSave={() => mutations.update.mutate(form)}
              onDelete={() => {
                mutations.remove.reset();
                setConfirmDelete(true);
              }}
            />
            <aside className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
              <h2 className="text-sm font-semibold">Dica</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                As mudanças de posição ficam pendentes até você salvar. Para
                mover um canal, arraste sobre a categoria ou sobre outro canal.
              </p>
              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs leading-5 text-slate-500">
                Alterações de nome, criação e exclusão são aplicadas
                imediatamente e registradas no canal privado de logs.
              </div>
            </aside>
          </div>
        </DndContext>
      )}
      {isDirty && (
        <UnsavedChangesBar
          error={mutations.save.isError ? mutations.save.error.message : undefined}
          pending={mutations.save.isPending}
          onDiscard={() => {
            discard();
            mutations.save.reset();
          }}
          onSave={() => draft && mutations.save.mutate(toPositionUpdates(draft))}
        />
      )}
      {dialog && activeTree && (
        <CreateChannelDialog
          kind={dialog}
          form={form}
          tree={activeTree}
          pending={mutations.create.isPending}
          error={mutations.create.isError ? mutations.create.error.message : undefined}
          onChange={setForm}
          onClose={() => setDialog(null)}
          onCreate={(payload) => mutations.create.mutate(payload)}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Apagar canal?"
        description={
          <>
            O canal <span className="font-medium text-slate-200">#{selectedChannel?.name}</span>{" "}
            será removido permanentemente do servidor.
          </>
        }
        confirmLabel="Apagar canal"
        pendingLabel="Apagando…"
        pending={mutations.remove.isPending}
        error={mutations.remove.isError ? mutations.remove.error.message : undefined}
        onConfirm={() => selectedChannel && mutations.remove.mutate(selectedChannel.id)}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
