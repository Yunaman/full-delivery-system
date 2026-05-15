import { getOrCreateDriver, json, makeSession } from "@/app/api/_db";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { phone?: unknown; otp?: unknown };
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const otp = typeof body?.otp === "string" ? body.otp.replace(/\D/g, "") : "";

  if (!phone || phone.replace(/[^\d+]/g, "").length < 10) {
    return json({ message: "Missing phone session. Please login again.", code: "missing_phone" }, { status: 400 });
  }
  if (!otp || otp.length !== 6) {
    return json({ message: "Enter the 6-digit OTP.", code: "invalid_otp" }, { status: 400 });
  }

  const driver = getOrCreateDriver({ phone, fullName: "Driver" });
  const session = makeSession(driver.id);

  return json({
    token: session.token,
    driver: {
      id: driver.id,
      fullName: driver.fullName,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      verifiedDriver: driver.verifiedDriver,
      documents: driver.documents,
      phoneVerified: driver.phoneVerified,
      accountStatus: driver.accountStatus,
      status: driver.status,
    },
  });
}

