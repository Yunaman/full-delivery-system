"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/services/http";
import * as Driver from "@/services/driver";
import * as Earnings from "@/services/earnings";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";
import { useOrderStore } from "@/store/orderStore";

export function useBootstrap() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const setMe = useDriverStore((s) => s.setMe);
  const setStatus = useDriverStore((s) => s.setStatus);
  const setEarnings = useDriverStore((s) => s.setEarnings);

  const refreshActive = useOrderStore((s) => s.refreshActive);

  useEffect(() => {
    if (!isAuthed || !token) return;
    let cancelled = false;

    const run = async () => {
      try {
        const me = await Driver.getMe(token);
        if (cancelled) return;
        setMe(me);
        setStatus(me.status);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logout();
          return;
        }
        toast.error(e instanceof Error ? e.message : "Failed to load profile.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, logout, setMe, setStatus, token]);

  useEffect(() => {
    if (!isAuthed || !token) return;
    let cancelled = false;

    const run = async () => {
      try {
        const summary = await Earnings.getSummary(token);
        if (cancelled) return;
        setEarnings({ todayEtb: summary.todayEtb, weekEtb: summary.weekEtb });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logout();
          return;
        }
      }
    };

    void run();
    const id = window.setInterval(() => void run(), 25_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isAuthed, logout, setEarnings, token]);

  useEffect(() => {
    if (!isAuthed || !token) return;
    void refreshActive();
  }, [isAuthed, refreshActive, token]);
}

