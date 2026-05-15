"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";

const nextAction: Record<string, { label: string; next: "Arrived" | "Picked Up" | "Delivered" } | null> = {
  Accepted: { label: "Mark Arrived", next: "Arrived" },
  Arrived: { label: "Picked Up", next: "Picked Up" },
  "Picked Up": { label: "Delivered", next: "Delivered" },
  Delivered: null,
  Incoming: null,
  Rejected: null,
  Expired: null,
};

export default function OrderCard({ order, compact }: { order: Order; compact?: boolean }) {
  const setActiveStatus = useOrderStore((s) => s.setActiveStatus);
  const action = nextAction[order.status];

  return (
    <Card className={cn("p-4", compact && "p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{order.restaurantName}</div>
          <div className="mt-1 text-xs text-muted">
            {order.pickupAddress} → {order.dropoffAddress}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{order.earningsBirr} birr</div>
          <div className="mt-1 text-xs text-muted">{order.distanceKm} km</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
          {order.status}
        </span>
        {order.stage === "ACTIVE" && action ? (
          <Button size="sm" variant="secondary" onClick={() => void setActiveStatus(action.next)}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
