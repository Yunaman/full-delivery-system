"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { OrderStatus, VendorOrder } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export type OrderCardProps = {
  order: VendorOrder;
  index?: number;
  href?: string;
};

const statusCopy: Record<OrderStatus, string> = {
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
};

const statusStyles: Record<OrderStatus, string> = {
  preparing:
    "bg-amber-50 text-amber-800 ring-amber-100",
  on_the_way:
    "bg-sky-50 text-sky-800 ring-sky-100",
  delivered:
    "bg-emerald-50 text-emerald-800 ring-emerald-100",
};

export function OrderCard({ order, index = 0, href }: OrderCardProps) {
  const contents = (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="space-y-4 rounded-[28px] bg-white p-4 text-left shadow-lg ring-1 ring-black/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            {order.id}
          </p>
          <h3 className="text-[16px] font-semibold leading-snug text-neutral-900">
            {order.title}
          </h3>
          <p className="text-[13px] text-neutral-500">{order.preview}</p>
          <p className="text-[13px] font-medium text-neutral-700">
            {order.customer} · {order.dropoff}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${statusStyles[order.status]}`}
        >
          {statusCopy[order.status]}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
        <p className="text-[13px] font-medium text-neutral-500">
          {order.placedAt}
        </p>
        <div className="text-right">
          <p className="text-[15px] font-semibold text-neutral-900">
            {formatPrice(order.vendorCut)}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            You keep · guest {formatPrice(order.total)}
          </p>
        </div>
      </div>
    </motion.article>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2">
        {contents}
      </Link>
    );
  }

  return contents;
}
