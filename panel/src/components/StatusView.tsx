import type { ReactNode } from "react";
import { PanelsTopLeft } from "lucide-react";

export function StatusView({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-blue-300">
          <PanelsTopLeft size={19} aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-slate-400">{children}</div>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
