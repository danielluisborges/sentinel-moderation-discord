import { Info } from "lucide-react";
import { primaryButton, secondaryButton } from "../../../components/ui/formStyles.js";

export function UnsavedChangesBar({
  error,
  pending,
  onDiscard,
  onSave,
}: {
  error?: string;
  pending: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed bottom-3 left-[280px] right-5 z-10 flex items-center gap-3 rounded-lg border border-slate-700 bg-[#111a28] px-4 py-3 shadow-xl max-md:left-20">
      <span className="flex flex-1 items-center gap-2 text-sm text-slate-300">
        <Info size={16} className="shrink-0 text-blue-300" />
        Alterações de posição não salvas
      </span>
      {error && (
        <span role="alert" className="hidden text-xs text-rose-300 sm:block">
          {error}
        </span>
      )}
      <button onClick={onDiscard} className={secondaryButton}>
        Descartar
      </button>
      <button
        onClick={onSave}
        disabled={pending}
        className={primaryButton}
      >
        {pending ? "Salvando…" : "Salvar alterações"}
      </button>
    </div>
  );
}
