import type { Response } from "express";
import { logger } from "../../logger.js";
import { ModerationError } from "../../utils/permissions.js";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface RouteErrorOptions {
  status: number;
  message: string | ((error: unknown) => string);
  logMessage: string;
  context?: Record<string, string>;
  level?: "warn" | "error";
}

export function sendRouteError(
  res: Response,
  error: unknown,
  options: RouteErrorOptions,
): void {
  const status =
    error instanceof ModerationError
      ? 403
      : error instanceof HttpError
        ? error.status
        : options.status;
  const message =
    error instanceof ModerationError || error instanceof HttpError
      ? error.message
      : typeof options.message === "function"
        ? options.message(error)
        : options.message;

  const context = { err: error, ...options.context };
  if (options.level === "error") logger.error(context, options.logMessage);
  else logger.warn(context, options.logMessage);
  if (!res.headersSent) res.status(status).json({ error: message });
}
