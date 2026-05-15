import type { LucideIcon } from "lucide-react";

export type OrderStatus = "preparing" | "on_the_way" | "delivered";

export type VendorOrder = {
  routeKey: string;
  id: string;
  title: string;
  preview: string;
  customer: string;
  dropoff: string;
  total: number;
  vendorCut: number;
  status: OrderStatus;
  placedAt: string;
  lineItems: string[];
  packNote?: string;
};

export type OrderFilterItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type MenuPulse = {
  id: string;
  name: string;
  image: string;
  categoryId: string;
  soldToday: number;
  vendorRevenue: number;
};

export type DispatchStop = {
  id: string;
  customer: string;
  address: string;
  etaWindow: string;
  image: string;
  parcels: number;
};
