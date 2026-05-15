import { getDriverByToken, json, readToken } from "@/app/api/_db";

export async function GET(req: Request) {
  const token = readToken(req);
  const driver = getDriverByToken(token);
  if (!driver) return json({ message: "Unauthorized", code: "unauthorized" }, { status: 401 });
  return json({ order: driver.activeOrder });
}

