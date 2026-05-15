import { getDriverByToken, json, readToken } from "@/app/api/_db";
import type { Order } from "@/lib/types";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!driver.activeOrder || driver.activeOrder.id !== id) {
    return json({ message: "Active order not found.", code: "active_order_not_found" }, { status: 404 });
  }

  const now = Date.now();
  const canceled: Order = { ...driver.activeOrder, updatedAt: now, status: "Rejected", stage: "PAST" };
  driver.activeOrder = null;
  driver.pastOrders = [canceled, ...driver.pastOrders];

  return json({ ok: true });
}

