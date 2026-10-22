import { Search, X } from "lucide-react";

export function MemberSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 sm:max-w-xs">
      <Search aria-hidden="true" size={16} className="text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nome ou usuário…"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="text-slate-500 hover:text-white"
        >
          <X size={15} />
        </button>
      )}
    </label>
  );
}
