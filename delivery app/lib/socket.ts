import { io, type Socket } from "socket.io-client";

type Handler<T = unknown> = (payload: T) => void;

export type SocketLike = Pick<Socket, "on" | "off" | "emit" | "connect" | "disconnect">;

class DisabledSocket {
  connect() {}
  disconnect() {}
  on<T = unknown>(_event: string, _handler: Handler<T>) {}
  off<T = unknown>(_event: string, _handler: Handler<T>) {}
  emit<T = unknown>(_event: string, _payload: T) {}
}

function createSocket(): SocketLike {
  if (typeof window !== "undefined") {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    if (url) {
      return io(url, {
        autoConnect: false,
        transports: ["websocket"],
      });
    }
  }
  return new DisabledSocket() as unknown as SocketLike;
}

export const socket: SocketLike = createSocket();
