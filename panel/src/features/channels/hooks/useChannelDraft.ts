import { useEffect, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { moveChannel } from "../lib/channelTree.js";

export function useChannelDraft(channels?: ChannelTreeDTO) {
  const [draft, setDraft] = useState<ChannelTreeDTO | null>(null);

  useEffect(() => {
    if (channels) setDraft(channels);
  }, [channels]);

  const isDirty = useMemo(
    () =>
      Boolean(
        draft && channels && JSON.stringify(draft) !== JSON.stringify(channels),
      ),
    [draft, channels],
  );

  function onDragEnd(event: DragEndEvent) {
    if (!draft || !event.over || event.active.id === event.over.id) return;
    const next = moveChannel(
      draft,
      String(event.active.id),
      String(event.over.id),
    );
    if (next) setDraft(next);
  }

  function discard() {
    setDraft(channels ?? null);
  }

  return { draft, setDraft, isDirty, onDragEnd, discard };
}
