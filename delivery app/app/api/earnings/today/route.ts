import { getDriverByToken, json, readToken } from "@/app/api/_db";

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function GET(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const day0 = startOfDay(Date.now());
  const amountEtb = driver.earningsHistory.reduce((sum, r) => (r.at >= day0 ? sum + r.amountEtb : sum), 0);
  return json({ amountEtb: Math.round(amountEtb) });
}

