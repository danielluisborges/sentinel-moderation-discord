import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
  labelClassName = "block text-sm text-slate-300",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`${labelClassName} ${className}`}
    >
      {label}
      {children}
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </label>
  );
}
