"use client";

import { apiFetch } from "@/services/http";
import type { LatLng, Order, OrderStatus } from "@/lib/types";

type ApiOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

type ApiOrder = {
  id: string;
  order_number?: string;
  customer_name?: string;
  vendor_name?: string;
  vendor_address?: string;
  vendor_latitude?: number | null;
  vendor_longitude?: number | null;
  delivery_address?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  status: ApiOrderStatus;
  total_price?: number;
  delivery_fee?: number;
  placed_at?: string;
  updated_at?: string;
};

export type OrderStatusUpdate = "picked_up" | "in_transit" | "delivered";

function coords(lat?: number | null, lng?: number | null): LatLng {
  return { lat: lat ?? 0, lng: lng ?? 0 };
}

function apiStatusToUi(status: ApiOrderStatus): OrderStatus {
  if (status === "ready" || status === "pending" || status === "confirmed" || status === "preparing") return "Incoming";
  if (status === "picked_up") return "Picked Up";
  if (status === "in_transit") return "Arrived";
  if (status === "delivered" || status === "completed") return "Delivered";
  return "Rejected";
}

function toUiOrder(order: ApiOrder): Order {
  const createdAt = order.placed_at ? Date.parse(order.placed_at) : Date.now();
  const updatedAt = order.updated_at ? Date.parse(order.updated_at) : createdAt;
  const status = apiStatusToUi(order.status);
  const stage = status === "Incoming" ? "INCOMING" : status === "Delivered" || status === "Rejected" ? "PAST" : "ACTIVE";

  return {
    id: order.id,
    createdAt,
    updatedAt,
    restaurantName: order.vendor_name || "Vendor",
    pickupAddress: order.vendor_address || "Pickup address pending",
    dropoffAddress: order.delivery_address || "Delivery address pending",
    pickupLocation: coords(order.vendor_latitude, order.vendor_longitude),
    dropoffLocation: coords(order.delivery_latitude, order.delivery_longitude),
    distanceKm: 0,
    earningsBirr: order.delivery_fee ?? 0,
    customerName: order.customer_name || "Customer",
    status,
    stage,
  };
}

function list(data: { results?: ApiOrder[] } | ApiOrder[]) {
  const orders = Array.isArray(data) ? data : data.results || [];
  return { orders: orders.map(toUiOrder) };
}

export async function getActive(token: string) {
  const data = await apiFetch<{ results?: ApiOrder[] } | ApiOrder[]>("/orders/active/", { method: "GET", token, retry: 1 });
  const orders = list(data).orders.filter((order) => order.stage !== "PAST");
  return { order: orders[0] ?? null };
}

export async function getAvailable(token: string) {
  const data = await apiFetch<{ results?: ApiOrder[] } | ApiOrder[]>("/orders/?status=ready&available_only=true", {
    method: "GET",
    token,
    retry: 1,
  });
  return list(data);
}

export async function getOrder(token: string, id: string) {
  const order = await apiFetch<ApiOrder>("/orders/" + encodeURIComponent(id) + "/", { method: "GET", token, retry: 1 });
  return { order: toUiOrder(order) };
}

export async function accept(token: string, id: string) {
  const { getDriverProfile } = await import("./auth");
  const profile = await getDriverProfile(token);
  const order = await apiFetch<ApiOrder>("/orders/" + encodeURIComponent(id) + "/assign_driver/", {
    method: "POST",
    token,
    body: { driver_id: profile.id },
  });
  return { order: toUiOrder(order) };
}

export async function patchStatus(token: string, id: string, status: OrderStatusUpdate) {
  const order = await apiFetch<ApiOrder>("/orders/" + encodeURIComponent(id) + "/update_status/", {
    method: "POST",
    token,
    body: { status, notes: "" },
  });
  return { order: toUiOrder(order) };
}

export async function cancel(token: string, id: string, reason?: string) {
  const order = await apiFetch<ApiOrder>("/orders/" + encodeURIComponent(id) + "/cancel/", {
    method: "POST",
    token,
    body: { reason: reason || "Driver unavailable" },
  });
  return { order: toUiOrder(order) };
}

export async function reject(token: string, id: string) {
  return cancel(token, id, "Rejected by driver");
}

export async function updateOrderLocation(token: string, id: string, latitude: number, longitude: number) {
  return apiFetch<{ status: string }>("/orders/" + encodeURIComponent(id) + "/update_location/", {
    method: "POST",
    token,
    body: { latitude, longitude },
  });
}

export async function getTracking(token: string, id: string) {
  return apiFetch<{
    driver_latitude: number;
    driver_longitude: number;
    estimated_arrival: string | null;
    distance_remaining: number | null;
    last_updated: string;
  }>("/orders/" + encodeURIComponent(id) + "/tracking/", {
    method: "GET",
    token,
    retry: 1,
  });
}
