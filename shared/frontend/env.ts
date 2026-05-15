export const API_URL_ENV = "NEXT_PUBLIC_API_URL";
export const WS_URL_ENV = "NEXT_PUBLIC_WS_URL";
export const SOCKET_URL_ENV = "NEXT_PUBLIC_SOCKET_URL";

export function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
}

export function wsBaseUrl() {
  return (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws").replace(/\/$/, "");
}

export function socketBaseUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL || "";
}
