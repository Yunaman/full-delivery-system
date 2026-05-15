import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DriverStatus, LatLng } from "@/lib/types";
import type { DriverMe } from "@/lib/apiTypes";

type DriverState = {
  status: DriverStatus;
  me: DriverMe | null;
  location: LatLng;
  deliveriesToday: number;
  totalDeliveries: number;
  earningsTodayBirr: number;
  earningsWeekBirr: number;
  setStatus: (status: DriverStatus) => void;
  setLocation: (location: LatLng) => void;
  setMe: (me: DriverMe | null) => void;
  setEarnings: (p: { todayEtb: number; weekEtb: number }) => void;
  recordDelivery: (earningsBirr: number) => void;
};

const ADDIS_ABABA: LatLng = { lat: 9.03, lng: 38.74 };

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      status: "OFFLINE",
      me: null,
      location: ADDIS_ABABA,
      deliveriesToday: 0,
      totalDeliveries: 0,
      earningsTodayBirr: 0,
      earningsWeekBirr: 0,
      setStatus: (status) => set({ status }),
      setLocation: (location) => set({ location }),
      setMe: (me) => set({ me }),
      setEarnings: (p) =>
        set({
          earningsTodayBirr: Math.max(0, p.todayEtb),
          earningsWeekBirr: Math.max(0, p.weekEtb),
        }),
      recordDelivery: (earningsBirr) =>
        set({
          deliveriesToday: get().deliveriesToday + 1,
          totalDeliveries: get().totalDeliveries + 1,
          earningsTodayBirr: Math.round((get().earningsTodayBirr + earningsBirr) * 100) / 100,
          earningsWeekBirr: Math.round((get().earningsWeekBirr + earningsBirr) * 100) / 100,
        }),
    }),
    {
      name: "dd_driver_v1",
      storage: typeof window === "undefined" ? undefined : createJSONStorage(() => localStorage),
      partialize: (s) => ({
        status: s.status,
        me: s.me,
        location: s.location,
        deliveriesToday: s.deliveriesToday,
        totalDeliveries: s.totalDeliveries,
        earningsTodayBirr: s.earningsTodayBirr,
        earningsWeekBirr: s.earningsWeekBirr,
      }),
    },
  ),
);
