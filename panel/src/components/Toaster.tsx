import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ToastMessage {
  id: number;
  message: string;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<{ message?: unknown }>).detail
        ?.message;
      if (typeof message !== "string" || !message.trim()) return;
      setToasts((current) => [
        ...current,
        { id: Date.now() + Math.random(), message },
      ]);
    };
    window.addEventListener("sentinel:toast", onToast);
    return () => window.removeEventListener("sentinel:toast", onToast);
  }, []);

  function dismiss(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <div
      aria-label="Notificações"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const pointerStart = useRef<{ x: number; y: number; at: number } | null>(
    null,
  );
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  function finishSwipe(direction: number) {
    setDragging(false);
    setDismissing(true);
    setOffsetX(direction * Math.max(window.innerWidth, 420));
    window.setTimeout(() => onDismiss(toast.id), 180);
  }

  return (
    <div
      role="status"
      onPointerDown={(event) => {
        if (!event.isPrimary || (event.target as HTMLElement).closest("button"))
          return;
        pointerStart.current = {
          x: event.clientX,
          y: event.clientY,
          at: performance.now(),
        };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!pointerStart.current || dismissing) return;
        const deltaX = event.clientX - pointerStart.current.x;
        const deltaY = event.clientY - pointerStart.current.y;
        if (Math.abs(deltaX) > Math.abs(deltaY)) setOffsetX(deltaX);
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        if (start) {
          const deltaX = event.clientX - start.x;
          const elapsed = Math.max(1, performance.now() - start.at);
          const velocity = deltaX / elapsed;
          if (
            Math.abs(deltaX) > 72 ||
            (Math.abs(deltaX) > 25 && Math.abs(velocity) > 0.55)
          ) {
            finishSwipe(Math.sign(deltaX || velocity));
          } else {
            setDragging(false);
            setOffsetX(0);
          }
        }
        pointerStart.current = null;
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
        setDragging(false);
        setOffsetX(0);
      }}
      style={{
        transform: `translateX(${offsetX}px)`,
        opacity: Math.max(0.25, 1 - Math.abs(offsetX) / 420),
        transition: dragging
          ? "none"
          : "transform 180ms ease-out, opacity 180ms ease-out",
      }}
      className="pointer-events-auto flex touch-pan-y select-none items-center gap-3 rounded-xl border border-emerald-500/25 bg-[#111a28] px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-black/30"
    >
      <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button
        type="button"
        aria-label="Dispensar notificação"
        onClick={() => onDismiss(toast.id)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
