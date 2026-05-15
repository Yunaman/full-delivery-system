import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function POST(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { lat?: unknown; lng?: unknown };
  const lat = typeof body?.lat === "number" ? body.lat : NaN;
  const lng = typeof body?.lng === "number" ? body.lng : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ message: "Invalid location payload", code: "invalid_location" }, { status: 400 });
  }

  driver.lastLocation = { lat, lng, at: Date.now() };
  return json({ ok: true });
}

