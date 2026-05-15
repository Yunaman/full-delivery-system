export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export type AuthTokens = {
  access: string;
  refresh?: string;
};

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getAccessToken() {
  return browserStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken() {
  return browserStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setAuthTokens(tokens: AuthTokens) {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

  // Sync with cookie for server-side middleware access
  if (typeof document !== "undefined") {
    document.cookie = `${ACCESS_TOKEN_KEY}=${tokens.access}; path=/; max-age=3600; SameSite=Lax`;
  }
}

export function clearAuthTokens() {
  const storage = browserStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);

  // Clear cookie
  if (typeof document !== "undefined") {
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
