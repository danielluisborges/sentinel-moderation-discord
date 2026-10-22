import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  canClose?: boolean;
  role?: "dialog" | "alertdialog";
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  overlayClassName?: string;
}

export function Modal({
  children,
  onClose,
  canClose = true,
  role = "dialog",
  labelledBy,
  describedBy,
  className = "",
  overlayClassName = "fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-[2px]",
}: ModalProps) {
  return (
    <div
      className={overlayClassName}
      role="presentation"
      onMouseDown={(event) => {
        if (canClose && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={className}
      >
        {children}
      </section>
    </div>
  );
}
