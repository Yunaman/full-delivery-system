"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePreferences } from "@/components/preferences-provider";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/products", label: "Products", icon: Store },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/team", label: "Team", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme, language, setLanguage, currency, setCurrency, t } =
    usePreferences();

  return (
    <div className="app-container relative bg-[var(--vh-page)] text-[var(--vh-ink)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_45%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
          <Link href="/dashboard" className="mb-8 block">
            <h2 className="text-2xl font-bold tracking-tight">VendorHub</h2>
            <p className="text-sm text-slate-500">{t("Vendor Control Center", "የሻጭ መቆጣጠሪያ ማዕከል")}</p>
          </Link>
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.label, link.label)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="w-full pb-28 lg:pb-8">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-500">
                {t("iOS-ready control panel", "ለ iOS ዝግጁ መቆጣጠሪያ")}
              </p>
              <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "ETB" | "USD")}
                className="ios-pill px-3 py-2 text-sm"
                aria-label="Currency"
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "am")}
                className="ios-pill px-3 py-2 text-sm"
                aria-label="Language"
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
              </select>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition active:scale-95"
              >
                {theme === "light" ? t("Dark", "ጨለማ") : t("Light", "ብርሃን")}
              </button>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-40 p-2 lg:hidden">
        <div className="ios-pill mx-auto grid max-w-md grid-cols-4 gap-1 p-2">
          {links.slice(0, 4).map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className="relative rounded-xl p-2 text-center">
                <motion.div whileTap={{ scale: 0.95 }} className={active ? "text-slate-900" : "text-slate-400"}>
                  <Icon className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-[11px] font-medium">{link.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
