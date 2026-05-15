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

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      <div className="mx-auto w-[min(640px,100%)] px-3 pb-3">
        <div className="glass flex items-center justify-between rounded-3xl px-2 py-2 shadow-glow">
          {items.map((it) => {
            const active = pathname === it.href;
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition",
                  active ? "bg-white text-black" : "text-white/75 hover:bg-white/10",
                )}
              >
                <Icon className={cn("size-4", active ? "text-black" : "text-white/65")} />
                {it.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

