"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { normalizePhone } from "@/lib/api";
import * as Auth from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.token);
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const user = useAuthStore((s) => s.user);
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const setSession = useAuthStore((s) => s.setSession);
  const logoutStore = useAuthStore((s) => s.logout);

  const startLogin = useCallback(
    async (phoneRaw: string) => {
      const phone = normalizePhone(phoneRaw);
      const loadingId = toast.loading("Sending OTP...");
      try {
        const res = await Auth.login(phone);
        setPendingPhone(res.phone, res.challengeId);
        toast.success("OTP sent.", { id: loadingId });
        router.push("/otp");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send OTP.", { id: loadingId });
      }
    },
    [router, setPendingPhone],
  );

  const submitOtp = useCallback(
    async (otpRaw: string) => {
      if (!pendingPhone) {
        toast.error("Missing phone session. Please login again.");
        router.replace("/login");
        return;
      }

      const otp = otpRaw.replace(/\D/g, "");
      const loadingId = toast.loading("Verifying...");
      try {
        const res = await Auth.verifyOtp(pendingPhone, otp);
        setSession({
          token: res.token,
          user: { driverId: res.driver.id, phone: res.driver.phone, name: res.driver.fullName },
        });
        toast.success("Welcome back.", { id: loadingId });
        router.replace("/home");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid OTP.", { id: loadingId });
      }
    },
    [pendingPhone, router, setSession],
  );

  const logout = useCallback(() => {
    logoutStore();
    toast.success("Logged out.");
    router.replace("/login");
  }, [logoutStore, router]);

  return { status, token, pendingPhone, user, startLogin, submitOtp, logout };
}

