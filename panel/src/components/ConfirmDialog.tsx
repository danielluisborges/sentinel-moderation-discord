import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "./ui/Modal.js";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  error?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "Aguarde…",
  pending = false,
  error,
  tone = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-rose-500 text-white hover:bg-rose-400"
      : "bg-blue-500 text-white hover:bg-blue-400";

  return (
    <Modal
      onClose={onClose}
      canClose={!pending}
      role="alertdialog"
      labelledBy="confirm-dialog-title"
      describedBy="confirm-dialog-description"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111a28] p-5 shadow-2xl shadow-black/50"
    >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
            <AlertTriangle size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="pr-7 text-lg font-semibold text-slate-100"
            >
              {title}
            </h2>
            <div
              id="confirm-dialog-description"
              className="mt-2 text-sm leading-6 text-slate-400"
            >
              {description}
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar confirmação"
            disabled={pending}
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-50 ${confirmClass}`}
          >
            {pending && <LoaderCircle size={15} className="animate-spin" />}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
    </Modal>
  );
}
