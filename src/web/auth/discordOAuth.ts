import { env } from "../../env.js";
import type { OAuthCredentials, UserSession } from "./session.js";
import { sessionStore } from "./session.js";

const discordApi = "https://discord.com/api/v10";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions?: string;
  permissions_new?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

function oauthConfig() {
  if (
    !env.DISCORD_CLIENT_ID ||
    !env.DISCORD_CLIENT_SECRET ||
    !env.DISCORD_REDIRECT_URI
  ) {
    throw new Error("OAuth do Discord não está configurado no .env.");
  }
  return {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URI,
  };
}

export function discordAuthorizationUrl(state: string): string {
  const config = oauthConfig();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCode(code: string): Promise<OAuthCredentials> {
  const config = oauthConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });
  const token = await requestToken(body);
  return credentialsFrom(token);
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${discordApi}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Discord OAuth retornou HTTP ${response.status}.`);
  }
  return (await response.json()) as TokenResponse;
}

function credentialsFrom(token: TokenResponse): OAuthCredentials {
  return {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
}

export async function fetchDiscordUserId(credentials: OAuthCredentials): Promise<string> {
  const response = await fetch(`${discordApi}/users/@me`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
  if (!response.ok) throw new Error(`Discord API retornou HTTP ${response.status}.`);
  const user = (await response.json()) as { id: string };
  return user.id;
}

export async function fetchUserGuilds(session: UserSession): Promise<DiscordGuild[]> {
  if (session.expiresAt <= Date.now()) {
    throw new Error("Token OAuth expirado. Entre novamente.");
  }
  const response = await fetch(`${discordApi}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!response.ok) throw new Error(`Discord API retornou HTTP ${response.status}.`);
  return (await response.json()) as DiscordGuild[];
}

export function removeSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}
