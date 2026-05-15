"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PremiumButton } from "@/components/PremiumButton";
import type { VendorOrder } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export type OrderDetailProps = {
  order: VendorOrder;
};

export function OrderDetail({ order }: OrderDetailProps) {
  const [readyForPickup, setReadyForPickup] = useState(false);
  const [handedOff, setHandedOff] = useState(false);

  const statusLabel = useMemo(() => {
    if (order.status === "preparing") return "Kitchen · focus mode";
    if (order.status === "on_the_way") return "Courier · live map";
    return "Archive · payouts locked";
  }, [order.status]);

  return (
    <div className="pb-36">
      <div className="relative overflow-hidden rounded-b-[36px] bg-neutral-900 px-6 pb-10 pt-6 text-white shadow-lg ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/orders"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 transition-transform active:scale-95"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </Link>
          <div className="rounded-full bg-emerald-400/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
            {order.id}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-white/65">
            {statusLabel}
          </p>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Ticket detail
          </h1>
          <p className="text-[15px] leading-relaxed text-white/82">{order.title}</p>
          <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/20">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              <div className="space-y-1">
                <p className="text-[14px] font-semibold">{order.customer}</p>
                <p className="text-[13px] text-white/72">{order.dropoff}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-6">
        <div className="space-y-3 rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Guest paid
              </p>
              <p className="text-[26px] font-semibold">{formatPrice(order.total)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                You keep
              </p>
              <p className="text-[20px] font-semibold text-emerald-700">
                {formatPrice(order.vendorCut)}
              </p>
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-4 space-y-2">
            <p className="text-[13px] font-semibold text-neutral-500">
              Build sheet
            </p>
            <ul className="space-y-2">
              {order.lineItems.map((line) => (
                <li
                  key={line}
                  className="rounded-2xl bg-neutral-50 px-3 py-2 text-[14px] text-neutral-900 ring-1 ring-neutral-100"
                >
                  {line}
                </li>
              ))}
            </ul>
            {order.packNote ? (
              <p className="rounded-2xl bg-amber-50 px-3 py-3 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
                Packing note · {order.packNote}
              </p>
            ) : null}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5 space-y-2"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Dispatch channel
          </p>
          <p className="text-[14px] text-neutral-600">{order.preview}</p>
          <p className="text-[13px] font-semibold text-neutral-900">{order.placedAt}</p>
        </motion.section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-100 bg-white px-4 pb-6 pt-4 shadow-[0_-12px_40px_-18px_rgba(15,23,42,0.18)]">
        <div className="mx-auto w-full max-w-md space-y-3">
          <PremiumButton
            type="button"
            variant="secondary"
            disabled={handedOff}
            onClick={() => setReadyForPickup((previous) => !previous)}
          >
            {readyForPickup ? "Ready · waiting on courier" : "Mark packaged"}
          </PremiumButton>
          <PremiumButton
            type="button"
            variant="ghost"
            disabled={handedOff}
            onClick={() => setHandedOff(true)}
          >
            {handedOff ? "Handoff logged" : "Scan courier QR"}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
}
