import { moderationActions, type ModerationAction } from "../lib/moderationActions.js";

export function ModerationForm({
  action,
  reason,
  durationMinutes,
  pending,
  onActionChange,
  onReasonChange,
  onDurationChange,
  onSubmit,
}: {
  action: ModerationAction;
  reason: string;
  durationMinutes: string;
  pending: boolean;
  onActionChange: (action: ModerationAction) => void;
  onReasonChange: (reason: string) => void;
  onDurationChange: (duration: string) => void;
  onSubmit: () => void;
}) {
  const selectedAction = moderationActions.find((item) => item.value === action)!;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="mt-6 border-t border-slate-800 pt-4"
    >
      <label htmlFor="moderation-action" className="text-sm font-medium text-slate-200">
        Ação de moderação
      </label>
      <select
        id="moderation-action"
        value={action}
        onChange={(event) => onActionChange(event.target.value as ModerationAction)}
        className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-blue-400"
      >
        {moderationActions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.optionLabel}
          </option>
        ))}
      </select>
      {action === "timeout" && (
        <label className="mt-4 block text-sm font-medium text-slate-200">
          Duração em minutos
          <input
            type="number"
            min={1}
            max={40320}
            required
            value={durationMinutes}
            onChange={(event) => onDurationChange(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-blue-400"
          />
          <span className="mt-1 block text-xs text-slate-500">
            De 1 minuto até 28 dias.
          </span>
        </label>
      )}
      <label htmlFor="moderation-reason" className="mt-4 block text-sm font-medium text-slate-200">
        Motivo
      </label>
      <textarea
        id="moderation-reason"
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        maxLength={512}
        rows={3}
        placeholder="Descreva o motivo (opcional)…"
        className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-10 w-full rounded-lg border border-rose-500/60 bg-rose-500/10 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
      >
        {pending ? "Aplicando ação…" : selectedAction.buttonLabel}
      </button>
    </form>
  );
}
