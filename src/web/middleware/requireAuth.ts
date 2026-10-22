import type { RequestHandler } from "express";
import {
  sessionCookieName,
  sessionStore,
  verifySessionToken,
} from "../auth/session.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = readCookie(req.headers.cookie, sessionCookieName);
  if (!token) {
    res.status(401).json({ error: "Autenticação necessária." });
    return;
  }

  try {
    const { payload } = await verifySessionToken(token);
    const sessionId = payload.sid;
    const session = typeof sessionId === "string" ? sessionStore.get(sessionId) : undefined;
    if (!session || payload.sub !== session.userId) {
      res.status(401).json({ error: "Sessão expirada. Entre novamente." });
      return;
    }
    res.locals.sentinelSession = session;
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
};

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    return undefined;
  }
}
