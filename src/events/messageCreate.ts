import { Events, type Message } from "discord.js";
import { rememberMessage } from "./messageSnapshotCache.js";

export default {
  name: Events.MessageCreate,
  execute(message: Message) {
    rememberMessage(message);
  },
};
