import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type {
  GuildDTO,
  MemberDTO,
  MemberEditOptionsDTO,
} from "../../../../../src/shared/dto.js";
import { apiRequest } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { Field } from "../../../components/ui/Field.js";
import { Modal } from "../../../components/ui/Modal.js";
import { inputClass } from "../../../components/ui/formStyles.js";

export function EditMemberDialog({
  guild,
  member,
  open,
  onClose,
}: {
  guild: GuildDTO;
  member: MemberDTO;
  open: boolean;
  onClose: () => void;
}) {
  const [savePending, setSavePending] = useState(false);
  const options = useQuery({
    queryKey: queryKeys.memberEditOptions(guild.id, member.id),
    queryFn: () =>
      apiRequest<MemberEditOptionsDTO>(
        `/api/guilds/${guild.id}/members/${member.id}/edit-options`,
      ),
    enabled: open,
  });

  if (!open) return null;

  return (
    <Modal
      onClose={onClose}
      canClose={!savePending}
      role="dialog"
      labelledBy="edit-member-title"
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#111a28] p-5 shadow-2xl shadow-black/50"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="edit-member-title"
            className="text-lg font-semibold text-slate-100"
          >
            Editar membro
          </h2>
          <p className="mt-1 text-sm text-slate-400">{member.displayName}</p>
        </div>
        <button
          type="button"
          aria-label="Fechar edição"
          onClick={onClose}
          disabled={savePending}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-40"
        >
          <X size={18} />
        </button>
      </header>

      {options.isPending && (
        <p className="py-8 text-center text-sm text-slate-400">
          Carregando cargos disponíveis…
        </p>
      )}
      {options.isError && (
        <p className="mt-5 rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-sm text-rose-200">
          {options.error.message}
        </p>
      )}
      {options.data && (
        <EditMemberForm
          key={member.id}
          guildId={guild.id}
          member={member}
          initial={options.data}
          onClose={onClose}
          onPendingChange={setSavePending}
        />
      )}
    </Modal>
  );
}

function EditMemberForm({
  guildId,
  member,
  initial,
  onClose,
  onPendingChange,
}: {
  guildId: string;
  member: MemberDTO;
  initial: MemberEditOptionsDTO;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    nickname: initial.nickname,
    roleIds: initial.roleIds,
    reason: "",
  }));
  const save = useMutation({
    meta: {
      successMessage: "Membro atualizado e alteração registrada nos logs.",
    },
    mutationFn: () =>
      apiRequest<void>(`/api/guilds/${guildId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nickname: form.nickname,
          roleIds: form.roleIds,
          ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members(guildId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.memberEditOptions(guildId, member.id),
        }),
      ]);
      onClose();
    },
  });

  useEffect(() => {
    onPendingChange(save.isPending);
  }, [onPendingChange, save.isPending]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  function toggleRole(roleId: string) {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-5">
      <Field
        label="Apelido no servidor"
        labelClassName="block text-sm font-medium text-slate-200"
      >
        <input
          value={form.nickname}
          onChange={(event) =>
            setForm((current) => ({ ...current, nickname: event.target.value }))
          }
          maxLength={32}
          placeholder={member.username}
          className={inputClass}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Deixe em branco para usar o nome padrão da conta.
        </span>
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-slate-200">Cargos</legend>
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/50 p-2">
          {initial.roles.length ? (
            initial.roles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={form.roleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="size-4 accent-blue-500"
                />
                {role.name}
              </label>
            ))
          ) : (
            <p className="p-2 text-sm text-slate-500">
              Nenhum cargo disponível para edição pela sua hierarquia.
            </p>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Cargos acima de você ou do Sentinel não podem ser alterados.
        </p>
      </fieldset>

      <Field
        label="Motivo da alteração (opcional)"
        labelClassName="block text-sm font-medium text-slate-200"
      >
        <textarea
          value={form.reason}
          onChange={(event) =>
            setForm((current) => ({ ...current, reason: event.target.value }))
          }
          maxLength={512}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {save.isError && (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-sm text-rose-200">
          {save.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          disabled={save.isPending}
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
        >
          {save.isPending && (
            <LoaderCircle size={15} className="animate-spin" />
          )}
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
