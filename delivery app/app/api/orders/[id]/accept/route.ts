import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });
  if (driver.activeOrder) return json({ message: "You already have an active order.", code: "active_order_exists" }, { status: 409 });

  const { id } = await ctx.params;
  const idx = driver.availableOrders.findIndex((o) => o.id === id);
  if (idx < 0) return json({ message: "Order not found.", code: "order_not_found" }, { status: 404 });

  const now = Date.now();
  const picked = driver.availableOrders[idx];
  const order = { ...picked, status: "Accepted" as const, stage: "ACTIVE" as const, updatedAt: now };

  driver.availableOrders = driver.availableOrders.filter((o) => o.id !== id);
  driver.activeOrder = order;

  return json({ order });
}

