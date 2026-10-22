import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ChannelTreeDTO } from "../../../../../src/shared/dto.js";
import { lookup } from "../lib/channelTree.js";
import type { ChannelSelection } from "../lib/types.js";

export function useChannelSelection(tree?: ChannelTreeDTO) {
  const location = useLocation();
  const [selected, setSelected] = useState<ChannelSelection>(null);
  const selectedChannel = tree ? lookup(tree, selected?.id) : undefined;

  useEffect(() => {
    const channelId = (location.state as { channelId?: string } | null)
      ?.channelId;
    if (!channelId || !tree) return;
    const channel = lookup(tree, channelId);
    if (channel) {
      setSelected({
        id: channel.id,
        kind: channel.type === "category" ? "category" : "channel",
      });
    }
  }, [tree, location.state]);

  return { selected, setSelected, selectedChannel };
}
