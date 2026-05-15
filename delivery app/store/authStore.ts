import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthStatus = "unauthenticated" | "pending_otp" | "authenticated";

export type DriverUser = {
  driverId: string;
  phone: string;
  name: string;
};

type AuthState = {
  status: AuthStatus;
  token: string | null;
  pendingPhone: string | null;
  challengeId: string | null;
  user: DriverUser | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setPendingPhone: (phone: string, challengeId: string | null) => void;
  setSession: (p: { token: string; user: DriverUser }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "unauthenticated",
      token: null,
      pendingPhone: null,
      challengeId: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setPendingPhone: (phone, challengeId) => set({ status: "pending_otp", pendingPhone: phone, challengeId }),
      setSession: ({ token, user }) => set({ status: "authenticated", token, user, pendingPhone: null, challengeId: null }),
      logout: () => set({ status: "unauthenticated", token: null, user: null, pendingPhone: null, challengeId: null }),
    }),
    {
      name: "dd_auth_v1",
      storage: typeof window === "undefined" ? undefined : createJSONStorage(() => localStorage),
      partialize: (s) => ({ status: s.status, token: s.token, user: s.user, pendingPhone: s.pendingPhone, challengeId: s.challengeId }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
