"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ListOrdered, Map, Wallet, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/map", label: "Map", icon: Map },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-72 shrink-0 p-4 md:block">
      <div className="glass h-[calc(100dvh-32px)] rounded-3xl p-4 shadow-glow">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
            <span className="text-lg font-semibold">DD</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Driver Dashboard</div>
            <div className="text-xs text-muted">Addis Ababa</div>
          </div>
        </div>

        <nav className="mt-5 space-y-1">
          {items.map((it) => {
            const active = pathname === it.href;
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  active ? "bg-white text-black" : "text-white/85 hover:bg-white/10",
                )}
              >
                <Icon className={cn("size-4", active ? "text-black" : "text-white/70")} />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 pt-6 text-xs text-muted">
          Premium UI • Offline-friendly
        </div>
      </div>
    </aside>
  );
}

