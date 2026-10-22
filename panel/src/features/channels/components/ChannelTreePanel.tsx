import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { RootDropZone } from "./DropZones.js";
import { SortableCategory } from "./SortableCategory.js";
import { SortableChannel } from "./SortableChannel.js";

export function ChannelTreePanel({
  tree,
  selectedId,
  onSelect,
}: {
  tree: ChannelTreeDTO;
  selectedId?: string;
  onSelect: (id: string, kind: "channel" | "category") => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1521]">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold">Canais e categorias</h2>
        <p className="mt-1 text-xs text-slate-500">Arraste para reorganizar</p>
      </div>
      <div className="max-h-[680px] space-y-2 overflow-y-auto p-2">
        <RootDropZone>
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Sem categoria
          </p>
          <SortableContext
            items={tree.uncategorized.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {tree.uncategorized.map((channel) => (
              <SortableChannel
                key={channel.id}
                channel={channel}
                selected={selectedId === channel.id}
                onSelect={() => onSelect(channel.id, "channel")}
              />
            ))}
          </SortableContext>
        </RootDropZone>
        <SortableContext
          items={tree.categories.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {tree.categories.map((category) => (
            <SortableCategory
              key={category.id}
              category={category}
              selected={selectedId === category.id}
              onSelect={() => onSelect(category.id, "category")}
            >
              <SortableContext
                items={category.children.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {category.children.map((channel) => (
                  <SortableChannel
                    key={channel.id}
                    channel={channel}
                    selected={selectedId === channel.id}
                    onSelect={() => onSelect(channel.id, "channel")}
                  />
                ))}
              </SortableContext>
            </SortableCategory>
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
