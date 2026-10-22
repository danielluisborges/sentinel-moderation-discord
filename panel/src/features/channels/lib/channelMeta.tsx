import {
  AudioLines,
  Folder,
  Hash,
  Megaphone,
  MessagesSquare,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type {
  ChannelKind,
  ChannelStructureChannel,
} from "../../../../../src/shared/dto.js";

export const channelIcons: Record<ChannelStructureChannel["type"], LucideIcon> = {
  text: Hash,
  voice: Volume2,
  stage: AudioLines,
  announcement: Megaphone,
  forum: MessagesSquare,
};

export const channelTypeLabels: Record<ChannelStructureChannel["type"], string> = {
  text: "Texto",
  voice: "Voz",
  stage: "Palco",
  announcement: "Anúncios",
  forum: "Fórum",
};

export function iconFor(type: ChannelKind) {
  const className = "size-4 shrink-0";
  if (type === "category") return <Folder className={className} />;
  if (type === "media") return <MessagesSquare className={className} />;
  const Icon = channelIcons[type as ChannelStructureChannel["type"]] ?? Hash;
  return <Icon className={className} />;
}

export function labelFor(type: ChannelKind) {
  return {
    text: "Canal de texto",
    voice: "Canal de voz",
    stage: "Canal de palco",
    category: "Categoria",
    announcement: "Canal de anúncios",
    forum: "Fórum",
    media: "Canal de mídia",
  }[type];
}

export function supportsTopic(type: ChannelKind) {
  return (
    type === "text" ||
    type === "announcement" ||
    type === "forum" ||
    type === "media"
  );
}
