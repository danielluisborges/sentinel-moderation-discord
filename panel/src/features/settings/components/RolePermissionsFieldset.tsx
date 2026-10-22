import type { RolePermission } from "../../../../../src/shared/rolePermissions.js";
import { rolePermissionOptions } from "../../../../../src/shared/rolePermissions.js";

export function RolePermissionsFieldset({
  permissions,
  onToggle,
}: {
  permissions: RolePermission[];
  onToggle: (permission: RolePermission) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm text-slate-300">Permissões iniciais</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {rolePermissionOptions.map((permission) => (
          <label
            key={permission.value}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-300"
          >
            <input
              type="checkbox"
              checked={permissions.includes(permission.value)}
              onChange={() => onToggle(permission.value)}
              className="size-4 accent-blue-500"
            />
            {permission.label}
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        O cargo começa sem permissões especiais. Não é possível criar cargos com
        Administrador por este formulário.
      </p>
    </fieldset>
  );
}
