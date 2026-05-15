import { getDriverByToken, json, readToken } from "@/app/api/_db";

async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function normalizeNonEmptyString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  return json({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    vehicleType: driver.vehicleType,
    verifiedDriver: driver.verifiedDriver,
    documents: driver.documents,
    phoneVerified: driver.phoneVerified,
    accountStatus: driver.accountStatus,
    status: driver.status,
  });
}

export async function PATCH(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const body = (await readBody(req)) as { fullName?: unknown; vehicleType?: unknown } | null;
  if (!body || typeof body !== "object") return json({ message: "Invalid body", code: "bad_request" }, { status: 400 });

  const fullName = normalizeNonEmptyString(body.fullName);
  const vehicleType = normalizeNonEmptyString(body.vehicleType);

  if (fullName) driver.fullName = fullName;
  if (vehicleType) driver.vehicleType = vehicleType;

  return json({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    vehicleType: driver.vehicleType,
    verifiedDriver: driver.verifiedDriver,
    documents: driver.documents,
    phoneVerified: driver.phoneVerified,
    accountStatus: driver.accountStatus,
    status: driver.status,
  });
}
