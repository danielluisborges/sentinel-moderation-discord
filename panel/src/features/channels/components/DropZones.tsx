import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

export function RootDropZone({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "bucket:root" });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg ${isOver ? "bg-blue-500/10 ring-1 ring-blue-400/30" : ""}`}
    >
      {children}
    </div>
  );
}

export function CategoryDropZone({
  categoryId,
  children,
}: {
  categoryId: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `bucket:${categoryId}` });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md ${isOver ? "bg-blue-500/10 ring-1 ring-blue-400/30" : ""}`}
    >
      {children}
    </div>
  );
}
