import { UserRoundMinus } from "lucide-react";
import type { RoleDetailsDTO } from "../../../../../src/shared/dto.js";

export function RoleMembersList({
  role,
  onRevoke,
}: {
  role: RoleDetailsDTO;
  onRevoke: (member: RoleDetailsDTO["members"][number]) => void;
}) {
  return role.members.length ? (
    <ul className="divide-y divide-slate-800">
      {role.members.map((member) => (
        <li key={member.id} className="flex items-center gap-3 px-4 py-3">
          <img
            src={member.avatarUrl}
            alt=""
            className="size-9 rounded-full bg-slate-800"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {member.name}
            </p>
            <p className="truncate text-xs text-slate-500">@{member.username}</p>
          </div>
          <button
            type="button"
            onClick={() => onRevoke(member)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-rose-800 hover:text-rose-300"
          >
            <UserRoundMinus size={14} /> Revogar
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <p className="p-4 text-sm text-slate-400">Nenhum membro possui este cargo.</p>
  );
}
