import { retryOrLogin } from "../../api/client.js";

export function QueryErrorState({
  error,
  retry,
  message = "Não foi possível carregar os dados.",
}: {
  error?: Error | null;
  retry: () => unknown;
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-sm text-rose-200"
    >
      <p>{message}</p>
      {error && <p className="mt-1 text-xs text-rose-300/80">{error.message}</p>}
      <button
        type="button"
        onClick={() => retryOrLogin(error, retry)}
        className="mt-3 font-medium text-rose-100 underline decoration-rose-400/50 underline-offset-4 hover:text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
