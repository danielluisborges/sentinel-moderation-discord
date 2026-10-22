import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChannelDTO } from "../../../../../src/shared/dto.js";
import { iconFor } from "../lib/channelMeta.js";

export function SortableChannel({
  channel,
  selected,
  onSelect,
}: {
  channel: ChannelDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id });
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      type="button"
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${isDragging ? "opacity-40" : ""} ${selected ? "bg-slate-800 text-blue-200" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
    >
      <span className="w-4 text-center text-sm">{iconFor(channel.type)}</span>
      <span className="truncate">{channel.name}</span>
    </button>
  );
}
