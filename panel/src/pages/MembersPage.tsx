import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { PageHeading } from "../components/ui/PageHeading.js";
import { EditMemberDialog } from "../features/members/components/EditMemberDialog.js";
import { MemberDetailsPanel } from "../features/members/components/MemberDetailsPanel.js";
import { MemberList } from "../features/members/components/MemberList.js";
import { useMembersList } from "../features/members/hooks/useMembersList.js";
import { useModerationAction } from "../features/members/hooks/useModerationAction.js";
import {
  moderationActionLabel,
  type ModerationAction,
} from "../features/members/lib/moderationActions.js";
import { useGuild } from "../hooks/useGuild.js";

export function MembersPage() {
  const guild = useGuild();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<ModerationAction>("ban");
  const [durationMinutes, setDurationMinutes] = useState("10");
  const [confirmAction, setConfirmAction] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const members = useMembersList(guild.id, search);
  const selected = members.results.find((member) => member.id === selectedId) ?? null;

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const moderation = useModerationAction(guild.id, (completedAction) => {
    setReason("");
    setConfirmAction(false);
    if (completedAction === "ban" || completedAction === "kick") {
      setSelectedId(null);
    }
  });

  function applyModeration() {
    if (!selected) return;
    moderation.mutate({
      action,
      userId: selected.id,
      reason: reason.trim() || undefined,
      ...(action === "timeout"
        ? { durationMinutes: Number(durationMinutes) }
        : {}),
    });
  }

  return (
    <div>
      <PageHeading
        active="members"
        guildId={guild.id}
        eyebrow={guild.name}
        title="Membros"
        description="Busque membros e gerencie ações de moderação do servidor."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <MemberList
          members={members}
          search={search}
          selectedId={selectedId}
          onSearchChange={setSearch}
          onSelect={(memberId) => {
            setSelectedId(memberId);
            setShowMemberMenu(false);
            moderation.reset();
          }}
        />
        <MemberDetailsPanel
          member={selected}
          menuOpen={showMemberMenu}
          action={action}
          reason={reason}
          durationMinutes={durationMinutes}
          moderationPending={moderation.isPending}
          onToggleMenu={() => setShowMemberMenu((visible) => !visible)}
          onEdit={() => {
            setShowMemberMenu(false);
            setEditMemberOpen(true);
          }}
          onActionChange={(nextAction) => {
            setAction(nextAction);
            moderation.reset();
          }}
          onReasonChange={setReason}
          onDurationChange={setDurationMinutes}
          onModerationSubmit={() => {
            moderation.reset();
            setConfirmAction(true);
          }}
        />
      </div>
      <ConfirmDialog
        open={confirmAction}
        title={`Confirmar: ${moderationActionLabel(action).toLowerCase()}?`}
        description={
          <>
            Você está prestes a aplicar a ação{" "}
            <strong>{moderationActionLabel(action)}</strong> em{" "}
            <span className="font-medium text-slate-200">
              {selected?.displayName ?? "este membro"}
            </span>
            . O motivo informado será incluído no registro privado.
          </>
        }
        confirmLabel={moderationActionLabel(action)}
        pendingLabel="Aplicando ação…"
        pending={moderation.isPending}
        error={moderation.isError ? moderation.error.message : undefined}
        onConfirm={applyModeration}
        onClose={() => setConfirmAction(false)}
      />
      {selected && (
        <EditMemberDialog
          guild={guild}
          member={selected}
          open={editMemberOpen}
          onClose={() => setEditMemberOpen(false)}
        />
      )}
    </div>
  );
}
