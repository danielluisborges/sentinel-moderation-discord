import { useState, type FormEvent } from "react";
import type { RolePermission } from "../../../../../src/shared/rolePermissions.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { buttonClass, inputClass } from "../../../components/ui/formStyles.js";
import { useRoleMutations } from "../hooks/useRoleMutations.js";
import { RolePermissionsFieldset } from "./RolePermissionsFieldset.js";

interface CreateRoleFormState {
  name: string;
  color: string;
  permissions: RolePermission[];
  hoist: boolean;
  mentionable: boolean;
  reason: string;
}

const initialForm: CreateRoleFormState = {
  name: "",
  color: "#5865F2",
  permissions: [],
  hoist: false,
  mentionable: false,
  reason: "",
};

export function CreateRoleForm({
  guildId,
  onCreated,
}: {
  guildId: string;
  onCreated: (roleId: string) => void;
}) {
  const [form, setForm] = useState<CreateRoleFormState>(initialForm);
  const mutations = useRoleMutations(guildId, "", (roleId) => {
    setForm((current) => ({
      ...current,
      name: "",
      permissions: [],
      reason: "",
    }));
    onCreated(roleId);
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutations.create.mutate({
      name: form.name,
      color: form.color,
      permissions: form.permissions,
      hoist: form.hoist,
      mentionable: form.mentionable,
      ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
    });
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <h2 className="font-semibold text-slate-100">Criar cargo</h2>
      <p className="mt-1 text-sm text-slate-400">
        Crie um cargo para depois atribuí-lo aos membros. A ação será registrada
        no canal privado de logs.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_100px]">
          <label className="block text-sm text-slate-300">
            Nome do cargo
            <input
              required
              minLength={1}
              maxLength={100}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Moderador"
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-300">
            Cor
            <input
              type="color"
              value={form.color}
              onChange={(event) =>
                setForm((current) => ({ ...current, color: event.target.value }))
              }
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950/60 p-1"
            />
          </label>
        </div>
        <RolePermissionsFieldset
          permissions={form.permissions}
          onToggle={(permission) =>
            setForm((current) => ({
              ...current,
              permissions: current.permissions.includes(permission)
                ? current.permissions.filter((value) => value !== permission)
                : [...current.permissions, permission],
            }))
          }
        />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.hoist}
              onChange={(event) =>
                setForm((current) => ({ ...current, hoist: event.target.checked }))
              }
              className="size-4 accent-blue-500"
            />
            Exibir separado na lista
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.mentionable}
              onChange={(event) =>
                setForm((current) => ({ ...current, mentionable: event.target.checked }))
              }
              className="size-4 accent-blue-500"
            />
            Permitir menções
          </label>
        </div>
        <label className="block text-sm text-slate-300">
          Motivo para o registro (opcional)
          <textarea
            value={form.reason}
            onChange={(event) =>
              setForm((current) => ({ ...current, reason: event.target.value }))
            }
            maxLength={512}
            rows={2}
            className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none focus:border-blue-400"
          />
        </label>
        {mutations.create.isError && (
          <PanelMessage tone="error">{mutations.create.error.message}</PanelMessage>
        )}
        <button
          type="submit"
          disabled={mutations.create.isPending}
          className={buttonClass}
        >
          {mutations.create.isPending ? "Criando cargo…" : "Criar cargo"}
        </button>
      </form>
    </section>
  );
}
