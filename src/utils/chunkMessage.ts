const discordLimit = 2000;

export function chunkMessage(message: string, limit = discordLimit): string[] {
  if (limit < 1) throw new RangeError("O limite precisa ser positivo.");
  const chunks: string[] = [];
  let remaining = message.trim();

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf("\n", limit);
    if (splitAt < Math.floor(limit * 0.5)) {
      splitAt = remaining.lastIndexOf(" ", limit);
    }
    if (splitAt < Math.floor(limit * 0.5)) splitAt = limit;

    // Avoid splitting a UTF-16 surrogate pair.
    if (splitAt > 0 && /[\uD800-\uDBFF]/.test(remaining[splitAt - 1] ?? "")) {
      splitAt -= 1;
    }
    const chunk = remaining.slice(0, splitAt).trimEnd();
    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}
