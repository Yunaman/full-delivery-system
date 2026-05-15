import { getOrCreateDriver, json } from "@/app/api/_db";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { phone?: unknown };
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!phone || phone.replace(/[^\d+]/g, "").length < 10) {
    return json({ message: "Enter a valid phone number.", code: "invalid_phone" }, { status: 400 });
  }

  // Ensure driver exists in the stub backend. Real backend would send OTP here.
  getOrCreateDriver({ phone, fullName: "Driver" });

  return json({
    phone,
    challengeId: `chl_${Date.now()}`,
  });
}

