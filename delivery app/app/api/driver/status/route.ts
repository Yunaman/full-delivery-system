import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function PATCH(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { status?: unknown };
  const status = body?.status === "ONLINE" || body?.status === "OFFLINE" ? body.status : null;
  if (!status) return json({ message: "Invalid status", code: "invalid_status" }, { status: 400 });

  driver.status = status;
  return json({ status });
}

