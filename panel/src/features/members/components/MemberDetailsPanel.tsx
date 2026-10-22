import type { MemberDTO } from "../../../../../src/shared/dto.js";
import { Avatar } from "../../../components/Avatar.js";
import { StatusView } from "../../../components/StatusView.js";
import type { ModerationAction } from "../lib/moderationActions.js";
import { MemberActionsMenu } from "./MemberActionsMenu.js";
import { ModerationForm } from "./ModerationForm.js";

export function MemberDetailsPanel({
  member,
  menuOpen,
  action,
  reason,
  durationMinutes,
  moderationPending,
  onToggleMenu,
  onEdit,
  onActionChange,
  onReasonChange,
  onDurationChange,
  onModerationSubmit,
}: {
  member: MemberDTO | null;
  menuOpen: boolean;
  action: ModerationAction;
  reason: string;
  durationMinutes: string;
  moderationPending: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onActionChange: (action: ModerationAction) => void;
  onReasonChange: (reason: string) => void;
  onDurationChange: (duration: string) => void;
  onModerationSubmit: () => void;
}) {
  return (
    <aside className="rounded-xl border border-slate-800 bg-[#0e1521]">
      <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
        <h2 className="text-sm font-semibold">Detalhes do membro</h2>
        {member && !member.isSentinel && (
          <MemberActionsMenu
            open={menuOpen}
            onToggle={onToggleMenu}
            onEdit={onEdit}
          />
        )}
      </div>
      {member ? (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={member.displayName} src={member.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-100">
                {member.displayName}
              </p>
              <p className="truncate text-xs text-slate-500">@{member.username}</p>
            </div>
          </div>
          <div className="mt-5 space-y-4 border-t border-slate-800 pt-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">ID do usuário</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-300">
                {member.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Entrou no servidor</p>
              <p className="mt-1 text-slate-300">
                {member.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString("pt-BR")
                  : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cargos</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {member.roles.length ? (
                  member.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-xs text-slate-300"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">
                    Nenhum cargo adicional
                  </span>
                )}
              </div>
            </div>
          </div>
          {member.isSentinel ? (
            <div className="mt-6 border-t border-slate-800 pt-4 text-sm text-amber-200">
              O Sentinel não pode moderar a própria conta. Para removê-lo ou
              bani-lo, use as configurações do servidor no Discord.
            </div>
          ) : (
            <ModerationForm
              action={action}
              reason={reason}
              durationMinutes={durationMinutes}
              pending={moderationPending}
              onActionChange={onActionChange}
              onReasonChange={onReasonChange}
              onDurationChange={onDurationChange}
              onSubmit={onModerationSubmit}
            />
          )}
        </div>
      ) : (
        <div className="p-4">
          <StatusView title="Selecione um membro">
            Os detalhes e as ações aparecerão aqui.
          </StatusView>
        </div>
      )}
    </aside>
  );
}
