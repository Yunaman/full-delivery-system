"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import * as Orders from "@/services/orders";

type OrderState = {
  incomingQueue: Order[];
  activeOrder: Order | null;
  pastOrders: Order[];
  refreshAvailable: () => Promise<void>;
  refreshActive: () => Promise<void>;
  acceptIncoming: (orderId: string) => Promise<void>;
  rejectIncoming: (orderId: string) => Promise<void>;
  expireIncoming: (orderId: string) => Promise<void>;
  cancelActive: () => Promise<void>;
  setActiveStatus: (status: Exclude<OrderStatus, "Incoming" | "Rejected" | "Expired">) => Promise<void>;
  clearAll: () => void;
};

function tokenOrThrow() {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("Missing session token.");
  return token;
}

function uiStatusToApi(s: Exclude<OrderStatus, "Incoming" | "Rejected" | "Expired">): Orders.OrderStatusUpdate {
  if (s === "Arrived") return "in_transit";
  if (s === "Picked Up") return "picked_up";
  if (s === "Delivered") return "delivered";
  return "in_transit";
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      incomingQueue: [],
      activeOrder: null,
      pastOrders: [],

      refreshAvailable: async () => {
        const token = tokenOrThrow();
        const res = await Orders.getAvailable(token);
        set({ incomingQueue: res.orders });
      },

      refreshActive: async () => {
        const token = tokenOrThrow();
        const res = await Orders.getActive(token);
        set({ activeOrder: res.order });
      },

      acceptIncoming: async (orderId) => {
        const token = tokenOrThrow();
        const res = await Orders.accept(token, orderId);
        set({
          activeOrder: res.order,
          incomingQueue: get().incomingQueue.filter((o) => o.id !== orderId),
        });
      },

      rejectIncoming: async (orderId) => {
        const token = tokenOrThrow();
        await Orders.reject(token, orderId);
        set({ incomingQueue: get().incomingQueue.filter((o) => o.id !== orderId) });
      },

      expireIncoming: async (orderId) => {
        const token = tokenOrThrow();
        await Orders.reject(token, orderId);
        set({ incomingQueue: get().incomingQueue.filter((o) => o.id !== orderId) });
      },

      cancelActive: async () => {
        const token = tokenOrThrow();
        const active = get().activeOrder;
        if (!active) return;
        await Orders.cancel(token, active.id);
        set({
          activeOrder: null,
          pastOrders: [{ ...active, status: "Rejected", stage: "PAST", updatedAt: Date.now() }, ...get().pastOrders],
        });
      },

      setActiveStatus: async (status) => {
        const token = tokenOrThrow();
        const active = get().activeOrder;
        if (!active) return;

        const apiStatus = uiStatusToApi(status);
        const res = await Orders.patchStatus(token, active.id, apiStatus);

        if (res.order.status === "Delivered") {
          set({
            activeOrder: null,
            pastOrders: [{ ...res.order, stage: "PAST" }, ...get().pastOrders],
          });
          return;
        }
        set({ activeOrder: res.order });
      },

      clearAll: () => set({ incomingQueue: [], activeOrder: null, pastOrders: [] }),
    }),
    {
      name: "dd_orders_v1",
      storage: typeof window === "undefined" ? undefined : createJSONStorage(() => localStorage),
      partialize: (s) => ({
        pastOrders: s.pastOrders,
      }),
    },
  ),
);
