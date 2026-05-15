import { getDriverByToken, json, readToken } from "@/app/api/_db";
import type { OrderStatus } from "@/lib/types";

function mapApiStatusToUiStatus(s: string): Exclude<OrderStatus, "Incoming" | "Rejected" | "Expired"> | null {
  if (s === "arrived") return "Arrived";
  if (s === "picked_up") return "Picked Up";
  if (s === "on_the_way") return "Picked Up";
  if (s === "delivered") return "Delivered";
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!driver.activeOrder || driver.activeOrder.id !== id) {
    return json({ message: "Active order not found.", code: "active_order_not_found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as null | { status?: unknown };
  const statusRaw = typeof body?.status === "string" ? body.status : "";
  const next = mapApiStatusToUiStatus(statusRaw);
  if (!next) return json({ message: "Invalid status", code: "invalid_status" }, { status: 400 });

  const now = Date.now();
  const updated = { ...driver.activeOrder, status: next, updatedAt: now };

  if (next === "Delivered") {
    driver.pastOrders = [{ ...updated, stage: "PAST" }, ...driver.pastOrders];
    driver.earningsHistory = [
      { id: `earn_${now}_${updated.id}`, orderId: updated.id, amountEtb: Math.round(updated.earningsBirr), at: now },
      ...driver.earningsHistory,
    ];
    driver.activeOrder = null;
    return json({ order: updated });
  }

  driver.activeOrder = updated;
  return json({ order: updated });
}

