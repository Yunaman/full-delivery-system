"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import type { DispatchStop } from "@/lib/types";

export type CartItemProps = {
  stop: DispatchStop;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
};

export function CartItem({
  stop,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-[28px] bg-white p-3 shadow-lg ring-1 ring-black/5"
    >
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-3xl bg-neutral-100">
        <Image
          src={stop.image}
          alt={`${stop.customer} stop`}
          fill
          sizes="72px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-[15px] font-semibold text-neutral-900">
              {stop.customer}
            </p>
            <p className="text-[13px] font-medium text-neutral-500">
              {stop.address}
            </p>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#2563eb]">
              ETA {stop.etaWindow}
            </p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onRemove(stop.id)}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
            aria-label={`Remove ${stop.customer} stop from run`}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </motion.button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
            Parcels · handoff
          </span>
          <div className="flex items-center gap-2 rounded-full bg-neutral-50 p-1 ring-1 ring-neutral-100">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onDecrement(stop.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm ring-1 ring-neutral-100"
              aria-label="Decrease parcels"
            >
              <Minus className="h-4 w-4" strokeWidth={2.25} />
            </motion.button>
            <span className="min-w-[28px] text-center text-[14px] font-semibold tabular-nums">
              {stop.parcels}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onIncrement(stop.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm"
              aria-label="Increase parcels"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
