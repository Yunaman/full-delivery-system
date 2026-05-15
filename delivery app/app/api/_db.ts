import { randomUUID } from "crypto";
import type { Order } from "@/lib/types";
import type { DriverMe, DriverDocument } from "@/lib/apiTypes";

type Session = { token: string; driverId: string; createdAt: number };

export type EarningsRow = { id: string; orderId: string; amountEtb: number; at: number };

type DriverRecord = DriverMe & {
  earningsHistory: EarningsRow[];
  availableOrders: Order[];
  activeOrder: Order | null;
  pastOrders: Order[];
  lastLocation: { lat: number; lng: number; at: number } | null;
};

type Db = {
  sessions: Map<string, Session>;
  drivers: Map<string, DriverRecord>;
};

declare global {
  // eslint-disable-next-line no-var
  var __dd_db: Db | undefined;
}

function seedOrders(addis: { lat: number; lng: number }): Order[] {
  const mk = (idx: number, r: string, c: string): Order => {
    const dLat = (Math.sin(idx * 91.17) * 0.02);
    const dLng = (Math.cos(idx * 73.11) * 0.03);
    const pickup = { lat: addis.lat + dLat, lng: addis.lng + dLng };
    const drop = { lat: addis.lat - dLat * 0.9, lng: addis.lng - dLng * 0.85 };
    const distanceKm = Math.max(1.2, Math.round((2.2 + Math.abs(dLat) * 80 + Math.abs(dLng) * 60) * 10) / 10);
    const earningsBirr = Math.round(55 + distanceKm * 18 + (idx % 3) * 12);
    const now = Date.now();
    return {
      id: `ord_${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
      restaurantName: r,
      pickupAddress: `${r}, Addis Ababa`,
      dropoffAddress: `${c}, Addis Ababa`,
      pickupLocation: pickup,
      dropoffLocation: drop,
      distanceKm,
      earningsBirr,
      customerName: c,
      status: "Incoming",
      stage: "INCOMING",
    };
  };

  const restaurants = ["Bole Coffee & Kitchen", "Piassa Injera House", "Kazanchis Grill", "Meskel Square Bistro"];
  const customers = ["Customer A", "Customer B", "Customer C", "Customer D"];

  return [mk(1, restaurants[0], customers[0]), mk(2, restaurants[1], customers[1]), mk(3, restaurants[2], customers[2]), mk(4, restaurants[3], customers[3])];
}

function defaultDocuments(): DriverDocument[] {
  return [
    { kind: "DRIVER_LICENSE", label: "Driver license", status: "Verified" },
    { kind: "ID_CARD", label: "National ID", status: "Pending" },
    { kind: "VEHICLE_REGISTRATION", label: "Vehicle registration", status: "Verified" },
  ];
}

export function getDb(): Db {
  if (!globalThis.__dd_db) {
    globalThis.__dd_db = {
      sessions: new Map(),
      drivers: new Map(),
    };
  }
  return globalThis.__dd_db;
}

export function makeSession(driverId: string) {
  const token = `dd_${randomUUID().replace(/-/g, "")}`;
  const s: Session = { token, driverId, createdAt: Date.now() };
  getDb().sessions.set(token, s);
  return s;
}

export function getDriverByToken(token: string | null) {
  if (!token) return null;
  const db = getDb();
  const session = db.sessions.get(token);
  if (!session) return null;
  return db.drivers.get(session.driverId) ?? null;
}

export function getOrCreateDriver(p: { phone: string; fullName?: string }) {
  const db = getDb();
  const phoneDigits = p.phone.replace(/[^\d]/g, "");
  const driverId = `DRV-${phoneDigits.slice(-4).padStart(4, "0")}`;

  const existing = db.drivers.get(driverId);
  if (existing) return existing;

  const documents = defaultDocuments();
  const verifiedDriver = documents.every((d) => d.status === "Verified");
  const record: DriverRecord = {
    id: driverId,
    fullName: p.fullName || "Driver",
    phone: p.phone,
    vehicleType: "Motorbike",
    verifiedDriver,
    documents,
    phoneVerified: true,
    accountStatus: verifiedDriver ? "Active" : "Pending",
    status: "OFFLINE",
    earningsHistory: [],
    availableOrders: seedOrders({ lat: 9.03, lng: 38.74 }),
    activeOrder: null,
    pastOrders: [],
    lastLocation: null,
  };
  db.drivers.set(driverId, record);
  return record;
}

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

export function readToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}
