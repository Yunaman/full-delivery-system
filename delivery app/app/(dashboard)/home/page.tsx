"use client";

import { memo, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import * as Driver from "@/services/driver";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";
import { useOrderStore } from "@/store/orderStore";
import type { DriverStatus, Order, OrderStatus } from "@/lib/types";

export default function HomePage() {
  const status = useDriverStore((s) => s.status);
  const setStatus = useDriverStore((s) => s.setStatus);
  const earningsTodayBirr = useDriverStore((s) => s.earningsTodayBirr);
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const pastOrders = useOrderStore((s) => s.pastOrders);
  const token = useAuthStore((s) => s.token);

  const [toggling, setToggling] = useState(false);

  const streakDays = useMemo(() => getStreakDays(pastOrders), [pastOrders]);
  const dailyGoalBirr = 500;

  const recentDeltaBirr = useMemo(() => getRecentDeltaBirr(pastOrders), [pastOrders]);

  const suggestion = useMemo(
    () => getSuggestionText({ status, order: activeOrder, earningsTodayBirr }),
    [activeOrder, earningsTodayBirr, status],
  );

  const handleToggleStatus = async () => {
    if (!token || toggling) return;
    const next = status === "ONLINE" ? "OFFLINE" : "ONLINE";
    setToggling(true);
    try {
      await Driver.patchStatus(token, next);
      setStatus(next);
      toast.success(next === "ONLINE" ? "You are online." : "You are offline.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-3">
      <TopStrip streakDays={streakDays} status={status} onToggleStatus={handleToggleStatus} disabled={toggling || !token} />

      <HeroEarnings
        earningsTodayBirr={earningsTodayBirr}
        dailyGoalBirr={dailyGoalBirr}
        recentDeltaBirr={recentDeltaBirr}
      />

      <ActiveDeliveryCard order={activeOrder} />

      <SmartSuggestion text={suggestion} />

      <QuickActions />
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 1) Top strip (minimal, one-hand)
 * ------------------------------------------------------------------------------------------------- */

function TopStrip(p: { streakDays: number; status: DriverStatus; onToggleStatus: () => void; disabled?: boolean }) {
  const isOnline = p.status === "ONLINE";
  return (
    <div className="flex items-center justify-between gap-2">
      <StreakChip days={p.streakDays} />

      <motion.button
        type="button"
        onClick={p.onToggleStatus}
        disabled={p.disabled}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "glass relative flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-full px-4",
          "shadow-glow ring-1",
          isOnline ? "ring-emerald-400/40" : "ring-white/10",
          "disabled:opacity-60",
        )}
        aria-pressed={isOnline}
        aria-label={`Driver is ${isOnline ? "online" : "offline"}. Tap to toggle.`}
      >
        <span className="relative flex size-2.5 items-center justify-center">
          <motion.span
            className={cn("absolute inset-0 rounded-full", isOnline ? "bg-emerald-400" : "bg-white/45")}
            animate={isOnline ? { opacity: [0.25, 0.85, 0.25], scale: [1, 1.65, 1] } : { opacity: 0.6, scale: 1 }}
            transition={isOnline ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          />
          <span className={cn("relative size-2 rounded-full", isOnline ? "bg-emerald-300" : "bg-white/55")} />
        </span>
        <span className="text-xs font-semibold tracking-wide">{isOnline ? "ONLINE" : "OFFLINE"}</span>
      </motion.button>
    </div>
  );
}

const StreakChip = memo(function StreakChip(p: { days: number }) {
  const daysLabel = p.days <= 0 ? "0" : String(p.days);
  return (
    <motion.div
      className="glass flex h-11 items-center gap-2 rounded-full px-4 shadow-glow ring-1 ring-white/10"
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      aria-label={`Streak ${daysLabel} days`}
    >
      <IconStreak className="size-4 text-amber-300" />
      <span className="text-sm font-semibold tabular-nums">{daysLabel}</span>
    </motion.div>
  );
});

/* -------------------------------------------------------------------------------------------------
 * 2) Hero earnings (very readable)
 * ------------------------------------------------------------------------------------------------- */

function HeroEarnings(p: { earningsTodayBirr: number; dailyGoalBirr: number; recentDeltaBirr: number }) {
  const progress = clamp(p.earningsTodayBirr / Math.max(1, p.dailyGoalBirr), 0, 1);
  const earningsLabel = useMemo(() => formatBirr(p.earningsTodayBirr), [p.earningsTodayBirr]);
  const recentLabel = useMemo(() => `+${formatBirr(p.recentDeltaBirr)} last 30 min`, [p.recentDeltaBirr]);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">EARNINGS</div>
          <div className="mt-2 text-5xl font-semibold tabular-nums leading-none tracking-tight sm:text-6xl">
            {earningsLabel}
          </div>
          <div className="mt-2 text-sm text-muted">{recentLabel}</div>
        </div>
        <ProgressRing progress={progress} label={`${Math.round(progress * 100)}%`} />
      </div>
    </Card>
  );
}

const ProgressRing = memo(function ProgressRing(p: { progress: number; label: string }) {
  const size = 72;
  const radius = 26;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamp(p.progress, 0, 1);

  return (
    <div className="shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="size-full -rotate-90" viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div className="text-sm font-semibold tabular-nums">{p.label}</div>
          <div className="text-[10px] text-muted">Goal</div>
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------------------------------
 * 3) Active delivery card (distraction-free)
 * ------------------------------------------------------------------------------------------------- */

function ActiveDeliveryCard(p: { order: Order | null }) {
  if (!p.order) {
    return (
      <Card className="p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">ACTIVE DELIVERY</div>
        <div className="mt-2 text-lg font-semibold tracking-tight">No active order</div>
        <div className="mt-1 text-sm text-muted">Go online to receive requests.</div>
      </Card>
    );
  }

  const etaMin = estimateEtaMinutes(p.order.distanceKm, p.order.status);
  const statusLabel = getOrderStatusLabel(p.order.status);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">ACTIVE DELIVERY</div>
          <div className="mt-1 truncate text-lg font-semibold tracking-tight">{p.order.customerName}</div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10">
            <span className={cn("size-2 rounded-full", getStatusDot(p.order.status))} />
            {statusLabel}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconAction href="tel:+251900000000" label="Call" icon={<IconPhone className="size-5" />} />
          <IconAction href="mailto:support@example.com" label="Report" icon={<IconAlert className="size-5" />} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="ETA" value={`~${etaMin} min`} />
        <Metric label="Distance" value={formatKm(p.order.distanceKm)} />
      </div>

      <div className="mt-4">
        <Link href={{ pathname: "/map", query: { orderId: p.order.id, focus: "active" } }} className="block">
          <Button className="h-14 w-full rounded-3xl text-base" size="lg">
            NAVIGATE
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function Metric(p: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="text-[11px] font-semibold text-muted">{p.label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums leading-tight">{p.value}</div>
    </div>
  );
}

function IconAction(p: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={p.href}
      className={cn(
        "glass inline-flex size-11 items-center justify-center rounded-2xl shadow-glow",
        "ring-1 ring-white/10 active:scale-[0.99]",
      )}
      aria-label={p.label}
    >
      <span className="text-white/90">{p.icon}</span>
    </a>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 4) Smart suggestion (one line)
 * ------------------------------------------------------------------------------------------------- */

function SmartSuggestion(p: { text: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold">{p.text}</div>
    </Card>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 5) Quick actions (thumb reach)
 * ------------------------------------------------------------------------------------------------- */

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <QuickAction href="/map" label="Map" icon={<IconMap className="size-5 text-white/90" />} />
      <QuickAction href="tel:+251900000000" label="Contact" icon={<IconPhone className="size-5 text-white/90" />} />
      <QuickAction href="mailto:support@example.com" label="Help" icon={<IconAlert className="size-5 text-white/90" />} className="col-span-2" />
    </div>
  );
}

function QuickAction(p: { href: string; label: string; icon: ReactNode; className?: string }) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className={cn(
        "glass flex h-16 items-center justify-between rounded-3xl px-4 shadow-glow ring-1 ring-white/10",
        "select-none",
        p.className,
      )}
      aria-label={p.label}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">{p.icon}</span>
        <span className="text-base font-semibold">{p.label}</span>
      </div>
      <IconChevron className="size-4 text-white/55" />
    </motion.div>
  );

  if (p.href.startsWith("tel:") || p.href.startsWith("mailto:")) {
    return (
      <a href={p.href} className="block">
        {content}
      </a>
    );
  }

  return (
    <Link href={p.href} className="block">
      {content}
    </Link>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Lightweight helpers
 * ------------------------------------------------------------------------------------------------- */

function getSuggestionText(p: { status: DriverStatus; order: Order | null; earningsTodayBirr: number }) {
  if (p.order) {
    return p.order.status === "Picked Up" ? "Focus: smooth ride to drop-off." : "Focus: reach pickup safely and fast.";
  }
  if (p.status === "OFFLINE") return "Go online when ready to start earning.";
  return p.earningsTodayBirr < 200 ? "Move toward the main road for faster orders." : "Stay nearby — activity looks good.";
}

function getStreakDays(pastOrders: Order[]) {
  const delivered = pastOrders.filter((o) => o.status === "Delivered");
  if (delivered.length === 0) return 0;

  const byDay = new Set<number>();
  for (const order of delivered) {
    const d = new Date(order.updatedAt || order.createdAt);
    d.setHours(0, 0, 0, 0);
    byDay.add(d.getTime());
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let days = 0;
  for (let i = 0; i < 14; i += 1) {
    const key = today.getTime() - i * 86_400_000;
    if (!byDay.has(key)) break;
    days += 1;
  }
  return days;
}

function getRecentDeltaBirr(pastOrders: Order[]) {
  const cutoff = Date.now() - 30 * 60_000;
  let sum = 0;
  for (const o of pastOrders) {
    if (o.status !== "Delivered") continue;
    const t = o.updatedAt || o.createdAt;
    if (t >= cutoff) sum += o.earningsBirr;
  }
  return clampInt(Math.round(sum), 0, 10_000);
}

function estimateEtaMinutes(distanceKm: number, status: OrderStatus) {
  const speedKmh = status === "Picked Up" ? 22 : 18;
  const base = (distanceKm / Math.max(1, speedKmh)) * 60;
  const buffer = status === "Accepted" ? 6 : status === "Arrived" ? 5 : status === "Picked Up" ? 7 : 6;
  return clampInt(Math.round(base + buffer), 4, 45);
}

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "Accepted":
      return "Accepted";
    case "Arrived":
      return "At pickup";
    case "Picked Up":
      return "On route";
    case "Delivered":
      return "Done";
    default:
      return status;
  }
}

function getStatusDot(status: OrderStatus) {
  switch (status) {
    case "Accepted":
      return "bg-sky-300";
    case "Arrived":
      return "bg-amber-300";
    case "Picked Up":
      return "bg-emerald-300";
    case "Delivered":
      return "bg-emerald-300";
    default:
      return "bg-white/45";
  }
}

function formatBirr(value: number) {
  const nf = new Intl.NumberFormat("en", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
  return nf.format(Number.isFinite(value) ? value : 0);
}

function formatKm(km: number) {
  const v = Number.isFinite(km) ? km : 0;
  return `${v.toFixed(v < 10 ? 1 : 0)} km`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/* -------------------------------------------------------------------------------------------------
 * Icons (small, lightweight)
 * ------------------------------------------------------------------------------------------------- */

function IconStreak(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path
        d="M13 2c.3 2.7-1 4.6-2.5 6.2C9 9.7 7.5 11.1 7.5 13.5 7.5 17 10.3 20 14.2 20c3.6 0 6.3-2.7 6.3-6.2 0-3.3-2.3-5.3-4-7.1-.8-.9-1.5-1.9-1.5-3.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMap(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path
        d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 4v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 6v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path
        d="M7 3h3l1.2 5-2 1.2c1 2.2 2.7 4 4.9 5l1.2-2 5 1.2v3c0 1.1-.9 2-2 2C10 21 3 14 3 5c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAlert(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M10.3 4.7 2.5 19.2c-.7 1.2.2 2.8 1.6 2.8h15.8c1.4 0 2.3-1.6 1.6-2.8L13.7 4.7a1.9 1.9 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevron(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden="true">
      <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
