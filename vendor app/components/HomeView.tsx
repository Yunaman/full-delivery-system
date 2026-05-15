"use client";

import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CategoryChip } from "@/components/CategoryChip";
import { FoodCard } from "@/components/FoodCard";
import { PromoBanner } from "@/components/PromoBanner";
import { HomeSkeleton } from "@/components/HomeSkeleton";
import { OrderCard } from "@/components/OrderCard";
import {
  dashboardStats,
  menuCategories,
  menuPulses,
  orderFilters,
  orders,
} from "@/lib/data";
import type { OrderStatus, VendorOrder } from "@/lib/types";

export function HomeView() {
  const [ready, setReady] = useState(false);
  const [laneFilterId, setLaneFilterId] = useState<string>("all");
  const [menuCategoryId, setMenuCategoryId] = useState<string>("all");

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 520);
    return () => clearTimeout(timeout);
  }, []);

  const laneOrders = useMemo((): VendorOrder[] => {
    if (laneFilterId === "all") return orders;
    return orders.filter(
      (ticket) => ticket.status === (laneFilterId as OrderStatus)
    );
  }, [laneFilterId]);

  const topMovers = useMemo(() => {
    if (menuCategoryId === "all") return menuPulses;
    return menuPulses.filter((row) => row.categoryId === menuCategoryId);
  }, [menuCategoryId]);

  if (!ready) {
    return <HomeSkeleton />;
  }

  return (
    <div className="space-y-6 px-4 pb-28 pt-3">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[28px] bg-neutral-900 p-5 text-white shadow-lg ring-1 ring-black/10"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-white/70">
              Vendor console
            </p>
            <p className="text-[22px] font-semibold tracking-tight">
              Hi, Pablo <span aria-hidden>👋</span>
            </p>
            <p className="text-[13px] text-white/65">
              {dashboardStats.inbound} inbound · {dashboardStats.outbound}{" "}
              live courier legs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              className="rounded-full bg-white/10 p-3 ring-1 ring-white/15 transition-colors hover:bg-white/15"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              className="rounded-full bg-white/10 p-3 ring-1 ring-white/15 transition-colors hover:bg-white/15"
              aria-label="Search tickets"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
            </motion.button>
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white/15 ring-2 ring-white/25">
              <Image
                src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                alt="Vendor profile avatar"
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Inbound",
            value: dashboardStats.inbound,
            caption: "tickets",
          },
          {
            label: "Prepping",
            value: dashboardStats.prepping,
            caption: "lines",
          },
          {
            label: "Courier",
            value: dashboardStats.outbound,
            caption: "legs live",
          },
        ].map((tile, tileIndex) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.05 * tileIndex,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-[28px] bg-white p-4 shadow-lg ring-1 ring-black/5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              {tile.label}
            </p>
            <p className="mt-2 text-[24px] font-semibold tracking-tight text-neutral-900">
              {tile.value}
            </p>
            <p className="text-[12px] font-medium text-neutral-500">
              {tile.caption}
            </p>
          </motion.div>
        ))}
      </div>

      <PromoBanner
        title="Peak payouts"
        subtitle="Surge mileage active · finish runs before 2PM"
        badge="+$2.50"
        imageSrc="https://images.unsplash.com/photo-1526367790996-972486b12b92?auto=format&fit=crop&w=700&q=80"
        imageAlt="Courier scooters ready for dispatch"
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-neutral-900">
            Fulfillment lanes
          </h2>
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
            SLA {dashboardStats.sla}
          </span>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide [-webkit-overflow-scrolling:touch]">
          {orderFilters.map((lane) => (
            <CategoryChip
              key={lane.id}
              label={lane.label}
              icon={lane.icon}
              active={laneFilterId === lane.id}
              onSelect={() => setLaneFilterId(lane.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-neutral-900">
            Priority desk
          </h2>
        </div>
        <div className="space-y-4">
          {laneOrders.slice(0, 2).map((order, index) => (
            <OrderCard
              key={order.routeKey}
              order={order}
              index={index}
              href={`/order/${order.routeKey}`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-neutral-900">
            Menu momentum
          </h2>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide [-webkit-overflow-scrolling:touch]">
          {menuCategories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.label}
              icon={category.icon}
              active={menuCategoryId === category.id}
              onSelect={() => setMenuCategoryId(category.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold text-neutral-900">
            Top movers
          </h2>
          <span className="text-[13px] font-semibold text-neutral-400">Today</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {topMovers.map((row, index) => (
            <FoodCard key={row.id} item={row} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
