import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  icon,
  children,
  className = "",
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-[#0e1521] p-5 ${className}`}
    >
      {(icon || title || description) && (
        <header className="mb-4 flex items-start gap-3">
          {icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
              {icon}
            </span>
          )}
          <div>
            <h2 className="font-semibold text-slate-100">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
