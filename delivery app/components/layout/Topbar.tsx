"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDriverStore } from "@/store/driverStore";

function titleFromPath(pathname: string) {
  switch (pathname) {
    case "/home":
      return "Dashboard";
    case "/orders":
      return "Orders";
    case "/map":
      return "Map";
    case "/earnings":
      return "Earnings";
    case "/profile":
      return "Profile";
    default:
      return "Driver";
  }
}

export default function Topbar() {
  const pathname = usePathname();
  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const status = useDriverStore((s) => s.status);

  return (
    <div className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-3 rounded-3xl bg-black/15 px-4 py-3 backdrop-blur md:bg-transparent md:px-0">
      <div>
        <div className="text-xs text-muted">Driver</div>
        <div className="text-lg font-semibold tracking-tight">{title}</div>
      </div>
      <div
        className={cn(
          "glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            status === "ONLINE" ? "bg-emerald-400" : "bg-white/40",
          )}
        />
        {status}
      </div>
    </div>
  );
}

