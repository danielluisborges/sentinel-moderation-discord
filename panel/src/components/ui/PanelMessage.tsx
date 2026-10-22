import type { ReactNode } from "react";

export function PanelMessage({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error" | "success";
}) {
  const colors = {
    default: "border-slate-800 bg-[#0e1521] text-slate-400",
    error: "border-rose-900/60 bg-rose-950/20 text-rose-200",
    success: "border-emerald-900/60 bg-emerald-950/20 text-emerald-200",
  };
  return (
    <div className={`rounded-xl border p-5 text-sm ${colors[tone]}`}>
      {children}
    </div>
  );
}
