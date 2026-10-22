import { Events, type Message, type PartialMessage } from "discord.js";
import { rememberMessage } from "./messageSnapshotCache.js";

export default {
  name: Events.MessageUpdate,
  async execute(
    _oldMessage: Message | PartialMessage,
    updatedMessage: Message | PartialMessage,
  ) {
    try {
      const message = updatedMessage.partial
        ? await updatedMessage.fetch()
        : updatedMessage;
      rememberMessage(message);
    } catch {
      // Keep the last snapshot if Discord no longer exposes the edited message.
    }
  },
};
