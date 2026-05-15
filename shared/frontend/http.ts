import { apiBaseUrl } from "./env";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./auth";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Json;
  token?: string | null;
  retryOnUnauthorized?: boolean;
};

async function parseResponse(res: Response) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown, status: number) {
  if (typeof payload === "object" && payload) {
    const data = payload as Record<string, unknown>;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
  }
  return `Request failed (${status})`;
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${apiBaseUrl()}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearAuthTokens();
    return null;
  }

  const payload = (await parseResponse(res)) as { access?: string } | null;
  if (!payload?.access) return null;
  setAuthTokens({ access: payload.access });
  return payload.access;
}

export async function apiRequest<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = opts.token === undefined ? getAccessToken() : opts.token;
  const headers = new Headers(opts.headers);
  headers.set("Accept", headers.get("Accept") || "application/json");

  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (opts.body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body: BodyInit | null | undefined =
    opts.body === undefined
      ? undefined
      : isFormData || typeof opts.body === "string"
        ? (opts.body as BodyInit)
        : JSON.stringify(opts.body);
  const request = () => fetch(url, { ...opts, headers, body });

  let res = await request();
  if (res.status === 401 && opts.retryOnUnauthorized !== false) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      res = await request();
    }
  }

  const payload = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(errorMessage(payload, res.status), res.status, { details: payload });
  }

  return payload as T;
}

export function extractResults<T>(response: { results?: T[]; count?: number } | T[]): T[] {
  return Array.isArray(response) ? response : response.results || [];
}
