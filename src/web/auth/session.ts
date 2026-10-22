import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../env.js";

const sessionDurationSeconds = env.SESSION_DURATION_MINUTES * 60;
const sessionCookieName = "sentinel_session";

export interface OAuthCredentials {
  accessToken: string;
  expiresAt: number;
}

export interface UserSession extends OAuthCredentials {
  id: string;
  userId: string;
  sessionExpiresAt: number;
}

export class SessionStore {
  private readonly sessions = new Map<string, UserSession>();

  create(userId: string, credentials: OAuthCredentials): UserSession {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.sessionExpiresAt <= now) {
        this.sessions.delete(id);
      }
    }
    const session: UserSession = {
      id: randomUUID(),
      userId,
      ...credentials,
      sessionExpiresAt: now + sessionDurationSeconds * 1000,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): UserSession | undefined {
    const session = this.sessions.get(id);
    if (session && session.sessionExpiresAt <= Date.now()) {
      this.sessions.delete(id);
      return undefined;
    }
    return session;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }
}

export const sessionStore = new SessionStore();
export { sessionCookieName, sessionDurationSeconds };

function signingKey(): Uint8Array {
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET, "utf8") < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 bytes.");
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signSession(session: UserSession): Promise<string> {
  return new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(signingKey());
}

export async function verifySessionToken(token: string) {
  return jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
}
