"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

export function useRealtime() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isAuthed || !token) {
      socket.disconnect();
      return;
    }

    try {
      (socket as unknown as { auth?: unknown }).auth = { token };
    } catch {
      // ignore
    }

    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [isAuthed, token]);
}

