import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  driver.availableOrders = driver.availableOrders.filter((o) => o.id !== id);
  return json({ ok: true });
}

