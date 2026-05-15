"use client";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: BodyInit | Json;
  headers?: HeadersInit;
  signal?: AbortSignal;
  retry?: number;
};

function baseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
}

function normalizeApiPath(path: string) {
  return path.replace(/^\/api(?=\/)/, "");
}

export function extractResults<T>(response: { results?: T[]; count?: number } | T[]): T[] {
  return Array.isArray(response) ? response : response.results || [];
}

async function parseJsonSafe(res: Response): Promise<unknown> {
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

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const normalizedPath = normalizeApiPath(path);
  const url = normalizedPath.startsWith("http")
    ? normalizedPath
    : `${baseUrl()}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  const headers = new Headers(opts.headers);
  headers.set("Accept", headers.get("Accept") || "application/json");

  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (opts.body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const body: BodyInit | null | undefined =
    opts.body === undefined ? undefined : isFormData || typeof opts.body === "string" ? (opts.body as BodyInit) : JSON.stringify(opts.body);

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });

  const payload = await parseJsonSafe(res);
  if (!res.ok) throw new ApiError(errorMessage(payload, res.status), res.status, payload);
  return payload as T;
}
