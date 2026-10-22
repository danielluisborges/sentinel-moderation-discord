import type { ChannelKind } from "../../../../../src/shared/dto.js";

export type ChannelSelection = {
  id: string;
  kind: "channel" | "category";
} | null;

export type ChannelForm = {
  name: string;
  type: ChannelKind;
  visibility: "public" | "moderators";
  parentId: string;
  topic: string;
};

export type CreateDialogKind = "channel" | "category";

export const emptyChannelForm: ChannelForm = {
  name: "",
  type: "text",
  visibility: "public",
  parentId: "",
  topic: "",
};
