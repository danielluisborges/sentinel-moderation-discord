import type { RequestHandler } from "express";
import { requireAuth } from "./requireAuth.js";
import { requireGuildAdmin } from "./requireGuildAdmin.js";

export const requireGuildAccess: RequestHandler[] = [
  requireAuth,
  requireGuildAdmin,
];
