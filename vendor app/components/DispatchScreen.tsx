"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CartItem } from "@/components/CartItem";
import { PremiumButton } from "@/components/PremiumButton";
import { formatPrice } from "@/lib/format";
import type { DispatchStop } from "@/lib/types";
import { getInitialDispatchStops } from "@/lib/data";

const PROOF_FEE_PER_STOP = 1.85;

export function DispatchScreen() {
  const [stops, setStops] = useState<DispatchStop[]>(() =>
    getInitialDispatchStops()
  );
  const [handedOff, setHandedOff] = useState(false);

  const routeTotal = useMemo(() => {
    const miles = stops.length * 2.45;
    const parcels = stops.reduce((acc, row) => acc + row.parcels, 0);
    const basePay = stops.length * 6.75 + parcels * 0.55;
    return { miles, basePay };
  }, [stops]);

  const payout = Number(
    (routeTotal.basePay + stops.length * PROOF_FEE_PER_STOP).toFixed(2)
  );

  const increment = (id: string) => {
    setStops((previous) =>
      previous.map((row) =>
        row.id === id ? { ...row, parcels: row.parcels + 1 } : row
      )
    );
  };

  const decrement = (id: string) => {
    setStops((previous) =>
      previous.map((row) =>
        row.id === id
          ? { ...row, parcels: Math.max(1, row.parcels - 1) }
          : row
      )
    );
  };

  const remove = (id: string) => {
    setStops((previous) => previous.filter((row) => row.id !== id));
  };

  const empty = stops.length === 0;

  return (
    <div className="space-y-6 px-4 pb-28 pt-4">
      <header className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Courier run
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-neutral-900">
          Dispatch board
        </h1>
        <p className="text-[14px] text-neutral-500">
          Bundle stops · scan proof · keep payouts moving.
        </p>
      </header>

      {empty ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-white px-6 py-16 text-center shadow-lg ring-1 ring-black/5"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 ring-1 ring-neutral-100">
            <Truck className="h-8 w-8 text-neutral-400" strokeWidth={1.75} />
          </div>
          <p className="text-[16px] font-semibold text-neutral-900">
            Run cleared
          </p>
          <p className="mt-2 text-[14px] text-neutral-500">
            HQ will push the next itinerary shortly.
          </p>
          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-semibold text-white shadow-lg transition-transform active:scale-95"
          >
            View kitchens
          </Link>
        </motion.div>
      ) : (
        <>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {stops.map((stop) => (
                <CartItem
                  key={stop.id}
                  stop={stop}
                  onIncrement={increment}
                  onDecrement={decrement}
                  onRemove={remove}
                />
              ))}
            </AnimatePresence>
          </ul>

          <motion.section
            layout
            className="space-y-4 rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between text-[14px] text-neutral-600">
              <span>Planned mileage</span>
              <span className="font-semibold text-neutral-900">
                {routeTotal.miles.toFixed(1)} mi est.
              </span>
            </div>
            <div className="flex items-center justify-between text-[14px] text-neutral-600">
              <span>Pickup bonus</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(routeTotal.basePay)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[14px] text-neutral-600">
              <span>Proof fee</span>
              <span className="font-semibold text-neutral-900">
                {formatPrice(PROOF_FEE_PER_STOP * stops.length)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[16px] font-semibold text-neutral-900">
              <span>Estimated payout</span>
              <span>{formatPrice(payout)}</span>
            </div>
            <PremiumButton
              type="button"
              disabled={handedOff}
              onClick={() => setHandedOff(true)}
            >
              {handedOff ? "Route marked active" : "Start live route"}
            </PremiumButton>
          </motion.section>
        </>
      )}
    </div>
  );
}
