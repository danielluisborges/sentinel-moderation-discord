import type { Message } from "discord.js";

export interface DeletedMessageSnapshot {
  authorId: string;
  authorTag: string;
  content: string;
  attachments: Array<{ name: string; url: string; isImage: boolean }>;
}

const snapshots = new Map<
  string,
  { savedAt: number; value: DeletedMessageSnapshot }
>();
const snapshotTtlMs = 60 * 60 * 1000;
const maxSnapshots = 10_000;

export function rememberMessage(message: Message): void {
  if (!message.guildId) return;
  snapshots.set(message.id, {
    savedAt: Date.now(),
    value: {
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content,
      attachments: [...message.attachments.values()].map((attachment) => ({
        name: attachment.name,
        url: attachment.url,
        isImage:
          attachment.contentType?.startsWith("image/") === true ||
          /\.(png|jpe?g|gif|webp|avif)$/i.test(attachment.name),
      })),
    },
  });

  while (snapshots.size > maxSnapshots) {
    const oldestId = snapshots.keys().next().value;
    if (!oldestId) break;
    snapshots.delete(oldestId);
  }
}

export function takeMessageSnapshot(
  messageId: string,
): DeletedMessageSnapshot | undefined {
  const snapshot = snapshots.get(messageId);
  snapshots.delete(messageId);
  if (!snapshot || Date.now() - snapshot.savedAt > snapshotTtlMs) {
    return undefined;
  }
  return snapshot.value;
}
