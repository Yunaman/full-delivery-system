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
}

export function clearAuthTokens() {
  const storage = browserStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}
