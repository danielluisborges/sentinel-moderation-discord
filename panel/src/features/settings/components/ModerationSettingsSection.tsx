import { selectClass } from "../../../components/ui/formStyles.js";

export function ModerationSettingsSection({
  roles,
  modRoleId,
  onChange,
}: {
  roles: Array<{ id: string; name: string }>;
  modRoleId: string;
  onChange: (roleId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <h2 className="font-semibold text-slate-100">Moderação</h2>
      <label className="mt-4 block text-sm text-slate-300" htmlFor="mod-role">
        Cargo de moderador
      </label>
      <select
        id="mod-role"
        value={modRoleId}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        <option value="">Sem cargo definido</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Administradores sempre mantêm acesso. O cargo selecionado poderá usar
        os recursos de moderação e acessar canais privados criados para
        moderadores.
      </p>
    </section>
  );
}
