import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function GET(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  // If a driver has an active order, do not offer new ones.
  if (driver.activeOrder) return json({ orders: [] });

  // Keep orders "fresh" by limiting count.
  const orders = (driver.availableOrders ?? []).slice(0, 5);
  return json({ orders });
}

