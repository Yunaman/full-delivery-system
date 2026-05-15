"use client";

import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import type { Order, OrderStatus } from "@/lib/types";

export default function OrdersPage() {
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const incoming = useOrderStore((s) => s.incomingQueue);
  const past = useOrderStore((s) => s.pastOrders);

  return (
    <div className="space-y-3">
      <ActiveOrderSection order={activeOrder} />
      <IncomingOrdersSection orders={incoming} />
      <HistorySection orders={past} />
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 1) Active order control center
 * ------------------------------------------------------------------------------------------------- */

function ActiveOrderSection(p: { order: Order | null }) {
  const setActiveStatus = useOrderStore((s) => s.setActiveStatus);
  const cancelActive = useOrderStore((s) => s.cancelActive);

  const [deliveryStarted, setDeliveryStarted] = useState(false);

  useEffect(() => {
    if (!p.order) {
      setDeliveryStarted(false);
      return;
    }
    setDeliveryStarted(getDeliveryStarted(p.order.id));
  }, [p.order?.id]);

  if (!p.order) return null;
  const order = p.order;

  const stageIndex = getStageIndex(order.status);
  const etaMin = estimateEtaMinutes(order.distanceKm, order.status);

  const next = getNextPrimaryAction(order, { deliveryStarted });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">ACTIVE ORDER</div>
          <div className="mt-1 truncate text-xl font-semibold tracking-tight">{order.customerName}</div>
          <div className="mt-1 text-sm text-muted">{order.restaurantName}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="ETA" value={`~${etaMin} min`} />
        <Metric label="Distance" value={formatKm(order.distanceKm)} />
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <ProgressIndicator stageIndex={stageIndex} />
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <RouteFlow pickup={order.restaurantName} drop={shortAddress(order.dropoffAddress)} />
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-muted ring-1 ring-white/10">
        Order items will appear here when provided by the backend.
      </div>

      <div className="mt-4">
        {next.kind === "link" ? (
          <Link href={next.href} className="block">
            <Button
              size="lg"
              className="h-14 w-full rounded-3xl text-base"
              onClick={() => {
                setDeliveryStarted(true);
                setDeliveryStartedFlag(order.id, true);
              }}
            >
              {next.label}
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            className="h-14 w-full rounded-3xl text-base"
            onClick={() => {
              if (next.kind === "status") {
                if (next.to === "Picked Up") {
                  setDeliveryStarted(false);
                  setDeliveryStartedFlag(order.id, false);
                }
                if (next.to === "Delivered") {
                  setDeliveryStarted(false);
                  setDeliveryStartedFlag(order.id, false);
                }
                void setActiveStatus(next.to);
              }
            }}
          >
            {next.label}
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <QuickIconAction href="tel:+251900000000" label="Call" icon={<IconPhone className="size-5" />} />
        <QuickIconAction
          href={{ pathname: "/map", query: { orderId: order.id, focus: "active" } }}
          label="Map"
          icon={<IconMap className="size-5" />}
        />
        <QuickIconAction
          href={`mailto:support@example.com?subject=${encodeURIComponent("Delivery issue")}&body=${encodeURIComponent(
            formatIssueBody({ order, issue: "Report issue" }),
          )}`}
          label="Report"
          icon={<IconAlert className="size-5" />}
        />
      </div>

      <details className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold">
          Issues / Options
          <span className="ml-2 text-xs text-muted">(tap)</span>
        </summary>
        <div className="grid gap-2 px-4 pb-4">
          <IssueRow order={order} label="Customer not responding" />
          <IssueRow order={order} label="Restaurant delay" />
          <IssueRow order={order} label="Wrong address" />
          <Button
            variant="danger"
            className="h-12 rounded-2xl"
            onClick={() => {
              const ok = window.confirm("Cancel this delivery?");
              if (!ok) return;
              void cancelActive();
            }}
          >
            Cancel delivery
          </Button>
        </div>
      </details>
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

const StatusBadge = memo(function StatusBadge(p: { status: OrderStatus }) {
  const style = getStatusStyle(p.status);
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1", style.container)}>
      <span className={cn("size-2 rounded-full", style.dot)} />
      {style.label}
    </div>
  );
});

function RouteFlow(p: { pickup: string; drop: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-2">
        <span className="mt-1 size-2.5 rounded-full bg-sky-300" />
        <div className="min-w-0">
          <div className="text-[11px] text-muted">Pickup</div>
          <div className="truncate text-sm font-semibold">{p.pickup}</div>
        </div>
      </div>
      <div className="pl-3">
        <div className="h-4 w-px bg-white/10" />
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-1 size-2.5 rounded-full bg-emerald-300" />
        <div className="min-w-0">
          <div className="text-[11px] text-muted">Drop</div>
          <div className="truncate text-sm font-semibold">{p.drop}</div>
        </div>
      </div>
    </div>
  );
}

function ProgressIndicator(p: { stageIndex: number }) {
  const steps = ["Accepted", "Arrived", "Picked", "Delivered"] as const;
  const progressPct = (clampInt(p.stageIndex, 0, 3) / 3) * 100;
  return (
    <div className="space-y-2">
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-white/80" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
        {steps.map((label, idx) => (
          <div key={label} className={cn(idx === p.stageIndex ? "text-white" : "text-white/45")}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function IssueRow(p: { order: Order; label: string }) {
  const href = useMemo(() => {
    const subject = `Issue: ${p.label}`;
    const body = formatIssueBody({ order: p.order, issue: p.label });
    return `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [p.label, p.order]);

  return (
    <a href={href} className="block">
      <Button variant="secondary" className="h-12 w-full rounded-2xl">
        {p.label}
      </Button>
    </a>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 5) Incoming orders (stacked cards + optional swipe)
 * ------------------------------------------------------------------------------------------------- */

function IncomingOrdersSection(p: { orders: Order[] }) {
  const acceptIncoming = useOrderStore((s) => s.acceptIncoming);
  const rejectIncoming = useOrderStore((s) => s.rejectIncoming);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">INCOMING</div>
        <div className="text-xs text-muted">{p.orders.length ? `${p.orders.length}` : "0"}</div>
      </div>

      <div className="mt-3 grid gap-3">
        {p.orders.length ? (
          p.orders.map((o) => (
            <IncomingOrderCard
              key={o.id}
              order={o}
              onAccept={() => void acceptIncoming(o.id)}
              onReject={() => void rejectIncoming(o.id)}
            />
          ))
        ) : (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted ring-1 ring-white/10">No incoming orders.</div>
        )}
      </div>
    </Card>
  );
}

function IncomingOrderCard(p: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
}) {
  const downX = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const handled = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (handled.current) return;
    pointerId.current = e.pointerId;
    downX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (handled.current) return;
    if (pointerId.current !== e.pointerId) return;
    const startX = downX.current;
    downX.current = null;
    pointerId.current = null;
    if (startX == null) return;
    const dx = e.clientX - startX;
    if (dx > 90) {
      handled.current = true;
      p.onAccept();
      return;
    }
    if (dx < -90) {
      handled.current = true;
      p.onReject();
    }
  };

  return (
    <div
      className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10"
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        downX.current = null;
        pointerId.current = null;
      }}
      aria-label="Incoming order. Swipe right to accept, left to reject."
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{p.order.restaurantName}</div>
          <div className="mt-1 text-sm text-muted">
            {formatKm(p.order.distanceKm)} - {formatBirr(p.order.earningsBirr)}
          </div>
        </div>
        <div className="shrink-0 rounded-2xl bg-black/10 px-3 py-2 text-right ring-1 ring-white/10">
          <div className="text-[11px] text-muted">Earnings</div>
          <div className="text-sm font-semibold tabular-nums">{formatBirr(p.order.earningsBirr)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="h-12 rounded-2xl" onClick={p.onAccept}>
          Accept
        </Button>
        <Button className="h-12 rounded-2xl" variant="secondary" onClick={p.onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * 6) History
 * ------------------------------------------------------------------------------------------------- */

function HistorySection(p: { orders: Order[] }) {
  const list = useMemo(() => p.orders.slice(0, 20), [p.orders]);
  return (
    <Card className="p-5">
      <div className="text-[11px] font-semibold tracking-[0.18em] text-muted">HISTORY</div>
      <div className="mt-3 grid gap-2">
        {list.length ? (
          list.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{o.restaurantName}</div>
                <div className="mt-0.5 text-[11px] text-muted">#{o.id.slice(0, 6)} - {getStatusStyle(o.status).label}</div>
              </div>
              <div className="shrink-0 text-sm font-semibold tabular-nums">{formatBirr(o.earningsBirr)}</div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted ring-1 ring-white/10">No past orders yet.</div>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Primary action logic
 * ------------------------------------------------------------------------------------------------- */

type PrimaryAction =
  | { kind: "status"; label: string; to: Exclude<OrderStatus, "Incoming" | "Rejected" | "Expired"> }
  | { kind: "link"; label: string; href: { pathname: string; query: Record<string, string> } };

function getNextPrimaryAction(order: Order, ctx: { deliveryStarted: boolean }): PrimaryAction {
  if (order.status === "Accepted") return { kind: "status", label: "ARRIVED AT RESTAURANT", to: "Arrived" };
  if (order.status === "Arrived") return { kind: "status", label: "PICKED UP ORDER", to: "Picked Up" };
  if (order.status === "Picked Up") {
    if (!ctx.deliveryStarted) {
      return { kind: "link", label: "START DELIVERY", href: { pathname: "/map", query: { orderId: order.id, focus: "active" } } };
    }
    return { kind: "status", label: "DELIVERED", to: "Delivered" };
  }
  return { kind: "status", label: "DELIVERED", to: "Delivered" };
}

function getStageIndex(status: OrderStatus) {
  switch (status) {
    case "Accepted":
      return 0;
    case "Arrived":
      return 1;
    case "Picked Up":
      return 2;
    case "Delivered":
      return 3;
    default:
      return 0;
  }
}

function getDeliveryStarted(orderId: string) {
  try {
    return window.sessionStorage.getItem(`dd_delivery_started_${orderId}`) === "1";
  } catch {
    return false;
  }
}

function setDeliveryStartedFlag(orderId: string, started: boolean) {
  try {
    if (started) window.sessionStorage.setItem(`dd_delivery_started_${orderId}`, "1");
    else window.sessionStorage.removeItem(`dd_delivery_started_${orderId}`);
  } catch {
    // ignore
  }
}

function formatIssueBody(p: { order: Order; issue: string }) {
  return [
    `Issue: ${p.issue}`,
    "",
    `Order: ${p.order.id}`,
    `Customer: ${p.order.customerName}`,
    `Restaurant: ${p.order.restaurantName}`,
    `Status: ${p.order.status}`,
    `Distance: ${p.order.distanceKm} km`,
    `Pickup: ${p.order.pickupAddress}`,
    `Drop: ${p.order.dropoffAddress}`,
  ].join("\n");
}

/* -------------------------------------------------------------------------------------------------
 * Lightweight helpers
 * ------------------------------------------------------------------------------------------------- */

function estimateEtaMinutes(distanceKm: number, status: OrderStatus) {
  const speedKmh = status === "Picked Up" ? 22 : 18;
  const base = (distanceKm / Math.max(1, speedKmh)) * 60;
  const buffer = status === "Accepted" ? 6 : status === "Arrived" ? 5 : status === "Picked Up" ? 7 : 6;
  return clampInt(Math.round(base + buffer), 4, 45);
}

function formatBirr(value: number) {
  const nf = new Intl.NumberFormat("en", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
  return nf.format(Number.isFinite(value) ? value : 0);
}

function formatKm(km: number) {
  const v = Number.isFinite(km) ? km : 0;
  return `${v.toFixed(v < 10 ? 1 : 0)} km`;
}

function shortAddress(address: string) {
  const trimmed = (address || "").trim();
  if (!trimmed) return "-";
  const first = trimmed.split(",")[0]?.trim();
  return first || trimmed;
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case "Accepted":
      return { label: "Accepted", container: "bg-sky-400/10 ring-sky-300/25 text-sky-200", dot: "bg-sky-300" };
    case "Arrived":
      return { label: "Arrived", container: "bg-amber-400/10 ring-amber-300/25 text-amber-200", dot: "bg-amber-300" };
    case "Picked Up":
      return { label: "Picked", container: "bg-emerald-400/10 ring-emerald-300/25 text-emerald-200", dot: "bg-emerald-300" };
    case "Delivered":
      return { label: "Delivered", container: "bg-emerald-400/10 ring-emerald-300/25 text-emerald-200", dot: "bg-emerald-300" };
    case "Rejected":
      return { label: "Rejected", container: "bg-rose-400/10 ring-rose-300/25 text-rose-200", dot: "bg-rose-300" };
    case "Expired":
      return { label: "Expired", container: "bg-white/5 ring-white/10 text-white/75", dot: "bg-white/40" };
    default:
      return { label: status, container: "bg-white/5 ring-white/10 text-white/75", dot: "bg-white/40" };
  }
}

/* -------------------------------------------------------------------------------------------------
 * Quick actions (icons)
 * ------------------------------------------------------------------------------------------------- */

function QuickIconAction(p: { href: string | { pathname: string; query?: Record<string, string> }; label: string; icon: ReactNode }) {
  const content = (
    <div
      className={cn(
        "glass flex h-14 items-center justify-center gap-2 rounded-3xl shadow-glow ring-1 ring-white/10",
        "active:scale-[0.99]",
      )}
      aria-label={p.label}
    >
      <span className="text-white/90">{p.icon}</span>
      <span className="text-sm font-semibold">{p.label}</span>
    </div>
  );

  if (typeof p.href === "string") {
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
 * Icons (small, lightweight)
 * ------------------------------------------------------------------------------------------------- */

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
