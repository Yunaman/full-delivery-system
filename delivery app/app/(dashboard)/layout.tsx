"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import OrderPopup from "@/components/orders/OrderPopup";
import { useAuthStore } from "@/store/authStore";
import { useOrders } from "@/hooks/useOrders";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useRealtime } from "@/hooks/useRealtime";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useOrders();
  useBootstrap();
  useRealtime();

  useEffect(() => {
    if (!hasHydrated) return;
    if (status !== "authenticated") router.replace("/login");
  }, [hasHydrated, router, status]);

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar />
      <div className="flex w-full flex-col px-4 pb-24 pt-4 md:px-8 md:pb-6">
        <Topbar />
        <main className="w-full max-w-5xl">{children}</main>
      </div>
      <BottomNav />
      <OrderPopup />
    </div>
  );
}
