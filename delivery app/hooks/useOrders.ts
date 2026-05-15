"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";
import { useOrderStore } from "@/store/orderStore";

export function useOrders() {
  const token = useAuthStore((s) => s.token);
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const driverStatus = useDriverStore((s) => s.status);

  const refreshAvailable = useOrderStore((s) => s.refreshAvailable);
  const refreshActive = useOrderStore((s) => s.refreshActive);

  const bootedRef = useRef(false);

  // Initial sync after login/hydration.
  useEffect(() => {
    if (!isAuthed || !token) return;
    if (bootedRef.current) return;
    bootedRef.current = true;
    void refreshActive();
    if (driverStatus === "ONLINE") void refreshAvailable();
  }, [driverStatus, isAuthed, refreshActive, refreshAvailable, token]);

  // Polling fallback (keeps UI updated even without websockets).
  useEffect(() => {
    if (!isAuthed || !token) return;
    const intervalMs = driverStatus === "ONLINE" ? 10_000 : 25_000;
    const id = window.setInterval(() => {
      void refreshActive();
      if (driverStatus === "ONLINE") void refreshAvailable();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [driverStatus, isAuthed, refreshActive, refreshAvailable, token]);

  // Realtime listeners (structure-ready; server can emit these).
  useEffect(() => {
    if (!isAuthed || !token) return;

    const onNewOrder = () => {
      toast("New order available", { duration: 2200 });
      void refreshAvailable();
    };

    const onOrderAssigned = () => {
      toast("Order assigned", { duration: 2000 });
      void refreshActive();
    };

    const onOrderUpdate = () => {
      void refreshActive();
    };

    socket.on("new_order", onNewOrder);
    socket.on("order_assigned", onOrderAssigned);
    socket.on("order_update", onOrderUpdate);

    return () => {
      socket.off("new_order", onNewOrder);
      socket.off("order_assigned", onOrderAssigned);
      socket.off("order_update", onOrderUpdate);
    };
  }, [isAuthed, refreshActive, refreshAvailable, token]);
}
