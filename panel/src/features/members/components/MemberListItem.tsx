import { ChevronRight } from "lucide-react";
import type { MemberDTO } from "../../../../../src/shared/dto.js";
import { Avatar } from "../../../components/Avatar.js";

export function MemberListItem({
  member,
  selected,
  onSelect,
}: {
  member: MemberDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/50 ${selected ? "bg-blue-500/10" : ""}`}
    >
      <Avatar name={member.displayName} src={member.avatarUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-100">
          {member.displayName}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          @{member.username}
        </span>
      </span>
      <span className="hidden max-w-[35%] truncate text-xs text-slate-500 sm:block">
        {member.roles.slice(0, 2).join(" · ")}
      </span>
      <ChevronRight size={16} className="text-slate-600" />
    </button>
  );
}
