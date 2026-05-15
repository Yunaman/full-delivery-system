"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  HelpCircle,
  MapPinned,
  Shield,
  Store,
} from "lucide-react";
import Image from "next/image";

type SettingRow = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Bell;
};

const rows: SettingRow[] = [
  {
    id: "storefront",
    label: "Storefront profile",
    hint: "Hours · photos · prep buffer",
    icon: Store,
  },
  {
    id: "zones",
    label: "Delivery zones",
    hint: "Radius map · surge blocks",
    icon: MapPinned,
  },
  {
    id: "payouts",
    label: "Payouts & tax",
    hint: "Stripe · next deposit Fri",
    icon: CircleDollarSign,
  },
  {
    id: "notifications",
    label: "Ops alerts",
    hint: "Late courier · SLA breach",
    icon: Bell,
  },
  {
    id: "privacy",
    label: "Compliance",
    hint: "Proof policy · handoffs",
    icon: Shield,
  },
  {
    id: "support",
    label: "Vendor success",
    hint: "Live chat · 6 min median",
    icon: HelpCircle,
  },
];

export function ProfileScreen() {
  return (
    <div className="space-y-6 px-4 pb-28 pt-4">
      <header className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Settings
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-neutral-900">
          Partner hub
        </h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-4 rounded-[28px] bg-neutral-900 p-5 text-white shadow-lg ring-1 ring-black/10"
      >
        <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[26px] bg-white/10 ring-2 ring-white/25">
          <Image
            src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80"
            alt="Lead operator"
            fill
            sizes="72px"
            className="object-cover"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 ring-1 ring-white/15">
            Verified vendor
          </div>
          <p className="truncate text-[20px] font-semibold leading-tight">
            Pablo · Mission Kitchen Collective
          </p>
          <p className="truncate text-[13px] text-white/68">
            operator@vendorhub.com · SF‑02 hub
          </p>
        </div>
      </motion.section>

      <section className="space-y-3">
        <p className="px-1 text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Operations
        </p>
        <div className="divide-y divide-neutral-100 overflow-hidden rounded-[28px] bg-white shadow-lg ring-1 ring-black/5">
          {rows.map((row, index) => {
            const Icon = row.icon;
            return (
              <motion.button
                key={row.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-800 ring-1 ring-neutral-100">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-[15px] font-semibold text-neutral-900">
                    {row.label}
                  </span>
                  <span className="block text-[13px] text-neutral-500">{row.hint}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-neutral-300" />
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
