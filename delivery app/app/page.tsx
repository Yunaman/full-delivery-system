"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";
import { useAuthStore } from "@/store/authStore";

export default function IndexPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.status === "authenticated");
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(isAuthenticated ? "/home" : "/login");
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-white/10">
            <span className="text-lg font-semibold">DD</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Driver Dashboard</div>
            <div className="text-xs text-muted">Loading session…</div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Loader />
          <div className="text-sm text-muted">Preparing your workspace</div>
        </div>
      </div>
    </div>
  );
}

