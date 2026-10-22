export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const loginRedirectStorageKey = "sentinel-login-redirect-at";
const loginRedirectCooldownMs = 30_000;
let loginRedirectStarted = false;

export function redirectToLoginOnUnauthorized(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 401) return false;
  if (loginRedirectStarted) return true;

  const now = Date.now();
  try {
    const previousRedirect = Number(
      window.sessionStorage.getItem(loginRedirectStorageKey),
    );
    if (
      Number.isFinite(previousRedirect) &&
      now - previousRedirect < loginRedirectCooldownMs
    ) {
      loginRedirectStarted = true;
      return true;
    }
    window.sessionStorage.setItem(loginRedirectStorageKey, String(now));
  } catch {
    // Keep the in-memory guard if session storage is unavailable.
  }

  loginRedirectStarted = true;
  window.location.assign("/auth/discord");
  return true;
}

export function retryOrLogin(error: unknown, retry: () => unknown): void {
  if (redirectToLoginOnUnauthorized(error)) return;
  void retry();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    let message = "Não foi possível concluir a solicitação.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the safe generic message when the server did not return JSON.
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
