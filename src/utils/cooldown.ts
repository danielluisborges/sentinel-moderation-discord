export class Cooldown {
  private readonly lastUse = new Map<string, number>();

  constructor(
    private readonly durationMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  remaining(userId: string): number {
    const now = this.now();
    const expiresAt = this.lastUse.get(userId);
    if (expiresAt === undefined || expiresAt <= now) {
      this.lastUse.delete(userId);
      return 0;
    }
    return expiresAt - now;
  }

  consume(userId: string): number {
    const remaining = this.remaining(userId);
    if (remaining > 0) return remaining;
    const now = this.now();
    this.lastUse.set(userId, now + this.durationMs);
    if (this.lastUse.size > 10_000) {
      for (const [id, expiresAt] of this.lastUse) {
        if (expiresAt <= now) this.lastUse.delete(id);
      }
    }
    return 0;
  }
}
