"use client";

import { motion } from "framer-motion";
import { Home, User, Package, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeDispatchLegCount } from "@/lib/data";

type NavKey = "home" | "orders" | "dispatch" | "profile";

const items: { key: NavKey; href: string; label: string; icon: typeof Home }[] =
  [
    { key: "home", href: "/", label: "Hub", icon: Home },
    { key: "orders", href: "/orders", label: "Orders", icon: Package },
    { key: "dispatch", href: "/dispatch", label: "Runs", icon: Truck },
    { key: "profile", href: "/profile", label: "Profile", icon: User },
  ];

function resolveActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const runStops = activeDispatchLegCount();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5 pt-2"
      aria-label="Primary"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="pointer-events-auto mx-4 flex w-full max-w-md items-center justify-between gap-1 rounded-[28px] bg-white px-3 py-2 shadow-lg shadow-neutral-900/10 ring-1 ring-black/5"
      >
        {items.map((item) => {
          const active = resolveActive(pathname, item.href);
          const Icon = item.icon;
          const showRunBadge = item.key === "dispatch" && runStops > 0;

          return (
            <Link
              key={item.key}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-3xl px-2 py-3 pb-4 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15"
            >
              <motion.span
                whileTap={{ scale: 0.94 }}
                className={`flex flex-col items-center gap-1 ${
                  active ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
                  {showRunBadge ? (
                    <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-bold text-white shadow-sm">
                      {runStops > 9 ? "9+" : runStops}
                    </span>
                  ) : null}
                </span>
                <span>{item.label}</span>
              </motion.span>
              {active ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute bottom-1 h-1 w-10 rounded-full bg-neutral-900"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
