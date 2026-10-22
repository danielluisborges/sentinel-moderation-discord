import { useState } from "react";
import { Shield, Trash2 } from "lucide-react";
import type { RoleDetailsDTO } from "../../../../../src/shared/dto.js";
import { ConfirmDialog } from "../../../components/ConfirmDialog.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { selectClass } from "../../../components/ui/formStyles.js";
import { useRoleDetails } from "../hooks/useRoleDetails.js";
import { useRoleMutations } from "../hooks/useRoleMutations.js";
import { RoleMembersList } from "./RoleMembersList.js";

export function RoleManagerSection({
  guildId,
  roles,
  roleId,
  onRoleChange,
  onRoleDeleted,
}: {
  guildId: string;
  roles: Array<{ id: string; name: string }>;
  roleId: string;
  onRoleChange: (roleId: string) => void;
  onRoleDeleted: () => void;
}) {
  const details = useRoleDetails(guildId, roleId);
  const [roleToDelete, setRoleToDelete] = useState<RoleDetailsDTO | null>(null);
  const [memberToRevoke, setMemberToRevoke] = useState<
    RoleDetailsDTO["members"][number] | null
  >(null);
  const mutations = useRoleMutations(
    guildId,
    roleId,
    undefined,
    onRoleDeleted,
    () => setMemberToRevoke(null),
  );

  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
            <Shield size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-100">Gerenciar cargos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Consulte quem possui cada cargo, revogue-o de membros ou exclua o
              cargo do servidor.
            </p>
          </div>
        </div>
        <label className="mt-4 block text-sm text-slate-300" htmlFor="manage-role">
          Cargo do servidor
        </label>
        <select
          id="manage-role"
          value={roleId}
          onChange={(event) => onRoleChange(event.target.value)}
          className={selectClass}
        >
          <option value="">Selecione um cargo</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {roleId && details.isPending && (
          <p className="mt-4 text-sm text-slate-400">Carregando membros do cargo…</p>
        )}
        {details.isError && (
          <PanelMessage tone="error">{details.error.message}</PanelMessage>
        )}
        {details.data && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: details.data.color }}
                />
                <div>
                  <p className="font-medium text-slate-100">{details.data.name}</p>
                  <p className="text-xs text-slate-400">
                    {details.data.memberCount}{" "}
                    {details.data.memberCount === 1 ? "membro possui" : "membros possuem"}{" "}
                    este cargo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleToDelete(details.data)}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-900/70 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-950/40"
              >
                <Trash2 size={15} /> Excluir cargo
              </button>
            </div>
            <RoleMembersList
              role={details.data}
              onRevoke={(member) => setMemberToRevoke(member)}
            />
          </div>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(memberToRevoke)}
        title="Revogar cargo do membro?"
        description={
          <>
            O cargo <strong className="text-slate-200">{details.data?.name}</strong>{" "}
            será removido de <strong className="text-slate-200">{memberToRevoke?.name}</strong>.
            A alteração será registrada nos logs.
          </>
        }
        confirmLabel="Revogar cargo"
        pending={mutations.revoke.isPending}
        pendingLabel="Revogando…"
        error={mutations.revoke.isError ? mutations.revoke.error.message : undefined}
        onConfirm={() => memberToRevoke && mutations.revoke.mutate(memberToRevoke.id)}
        onClose={() => {
          setMemberToRevoke(null);
          mutations.revoke.reset();
        }}
      />
      <ConfirmDialog
        open={Boolean(roleToDelete)}
        title="Excluir cargo do servidor?"
        description={
          <>
            O cargo <strong className="text-slate-200">{roleToDelete?.name}</strong>{" "}
            será excluído e removido de{" "}
            <strong className="text-slate-200"> {roleToDelete?.memberCount ?? 0} membros</strong>.
            Essa ação será registrada nos logs e não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir cargo"
        pending={mutations.remove.isPending}
        pendingLabel="Excluindo…"
        error={mutations.remove.isError ? mutations.remove.error.message : undefined}
        onConfirm={() => roleToDelete && mutations.remove.mutate(roleToDelete.id)}
        onClose={() => {
          setRoleToDelete(null);
          mutations.remove.reset();
        }}
      />
    </>
  );
}
