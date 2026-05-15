import { wsBaseUrl } from "./env";

export function websocketUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${wsBaseUrl()}${suffix}`;
}

export function reconnectDelay(attempt: number) {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}
