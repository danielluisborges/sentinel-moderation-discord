import { MoreHorizontal, Pencil } from "lucide-react";

export function MemberActionsMenu({
  open,
  onToggle,
  onEdit,
}: {
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Mais ações do membro"
        aria-expanded={open}
        onClick={onToggle}
        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-lg border border-slate-700 bg-[#111a28] p-1 shadow-xl">
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
          >
            <Pencil size={15} /> Editar apelido e cargos
          </button>
        </div>
      )}
    </div>
  );
}
