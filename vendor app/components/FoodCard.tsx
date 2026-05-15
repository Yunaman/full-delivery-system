"use client";

import { motion } from "framer-motion";
import { LayoutList, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { MenuPulse } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export type FoodCardProps = {
  item: MenuPulse;
  index?: number;
};

export function FoodCard({ item, index = 0 }: FoodCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-[28px] bg-white shadow-lg ring-1 ring-black/5"
    >
      <Link
        href="/orders"
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2"
        aria-label={`${item.name} · ${item.soldToday} sold today · open fulfillment queue`}
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 448px) 50vw, 220px"
            className="object-cover"
            priority={index < 2}
          />
          <span className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-1 ring-black/5">
            <LayoutList className="h-5 w-5" strokeWidth={2.25} />
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold leading-snug text-neutral-900">
              {item.name}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <TrendingUp className="h-3 w-3" />
              {item.soldToday}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-neutral-900">
            {formatPrice(item.vendorRevenue)}{" "}
            <span className="text-[12px] font-medium text-neutral-500">
              seller share
            </span>
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
