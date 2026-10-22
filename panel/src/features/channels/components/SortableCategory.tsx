import { useSortable } from "@dnd-kit/sortable";
import { ChevronDown, Folder } from "lucide-react";
import type { ReactNode } from "react";
import type { ChannelDTO } from "../../../../../src/shared/dto.js";
import { CategoryDropZone } from "./DropZones.js";
import { CSS } from "@dnd-kit/utilities";

export function SortableCategory({
  category,
  selected,
  onSelect,
  children,
}: {
  category: ChannelDTO;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-transparent ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        {...attributes}
        {...listeners}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${selected ? "bg-slate-800 text-blue-200" : "text-slate-200 hover:bg-slate-800/70"}`}
      >
        <ChevronDown size={14} className="shrink-0 text-slate-500" />
        <Folder size={16} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">{category.name}</span>
        <span className="text-xs text-slate-500">
          {category.children.length}
        </span>
      </button>
      <CategoryDropZone categoryId={category.id}>
        <div className="ml-2 min-h-7 border-l border-slate-800 py-1 pl-1">
          {children}
        </div>
      </CategoryDropZone>
    </div>
  );
}
