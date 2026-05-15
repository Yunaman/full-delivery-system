import {
  CheckCheck,
  ChefHat,
  Coffee,
  IceCream2,
  ListFilter,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type {
  DispatchStop,
  MenuPulse,
  OrderFilterItem,
  VendorOrder,
} from "./types";

export const menuCategories: OrderFilterItem[] = [
  { id: "all", label: "All", icon: UtensilsCrossed },
  { id: "pizza", label: "Pizza", icon: Pizza },
  { id: "burger", label: "Sandwich", icon: Sandwich },
  { id: "bowl", label: "Bowls", icon: Soup },
  { id: "salad", label: "Salads", icon: Salad },
  { id: "sweet", label: "Sweet", icon: IceCream2 },
  { id: "drinks", label: "Drinks", icon: Coffee },
];

export const dashboardStats = {
  inbound: 8,
  prepping: 5,
  outbound: 3,
  sla: "98% on-time",
} as const;

export const orderFilters: OrderFilterItem[] = [
  { id: "all", label: "All", icon: ListFilter },
  { id: "preparing", label: "Prep", icon: ChefHat },
  { id: "on_the_way", label: "Live", icon: Truck },
  { id: "delivered", label: "Done", icon: CheckCheck },
];

export const menuPulses: MenuPulse[] = [
  {
    id: "truffle-mushroom",
    categoryId: "pizza",
    name: "Truffle Mushroom",
    soldToday: 43,
    vendorRevenue: 412.5,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "smoky-bbq-burger",
    categoryId: "burger",
    name: "Smoky BBQ Burger",
    soldToday: 61,
    vendorRevenue: 528.25,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "crispy-chicken-bowl",
    categoryId: "bowl",
    name: "Crispy Chicken Bowl",
    soldToday: 38,
    vendorRevenue: 305.0,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "avocado-greens",
    categoryId: "salad",
    name: "Avocado Greens",
    soldToday: 27,
    vendorRevenue: 198.5,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "berry-parfait",
    categoryId: "sweet",
    name: "Berry Parfait",
    soldToday: 19,
    vendorRevenue: 96.75,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cold-brew-float",
    categoryId: "drinks",
    name: "Cold Brew Float",
    soldToday: 52,
    vendorRevenue: 224.0,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  },
];

export const orders: VendorOrder[] = [
  {
    routeKey: "o-2048",
    id: "VH-2048",
    title: "Truffle Mushroom · Avocado Greens",
    preview: "Marketplace · Courier collect 12:52",
    customer: "Sofia R.",
    dropoff: "88 Market St · Ring suite 502",
    total: 34.2,
    vendorCut: 28.75,
    status: "preparing",
    placedAt: "Due 12:52 PM",
    lineItems: ["Truffle Mushroom x1", "Avocado Greens x1", "Serve hot"],
    packNote: "Seal drinks separately",
  },
  {
    routeKey: "o-1988",
    id: "VH-1988",
    title: "Smoky BBQ Burger · Cold Brew Float",
    preview: "Partnership · Driver en route",
    customer: "Jordan P.",
    dropoff: "15th & Castro · Leave with lobby",
    total: 26.1,
    vendorCut: 21.5,
    status: "on_the_way",
    placedAt: "Picked up 11:03 AM",
    lineItems: ["Smoky BBQ Burger x1", "Cold Brew Float x1"],
  },
  {
    routeKey: "o-1862",
    id: "VH-1862",
    title: "Crispy Chicken Bowl",
    preview: "Direct · Proof of drop attached",
    customer: "Morgan L.",
    dropoff: "SoMa Hub · Locker B12",
    total: 15.9,
    vendorCut: 13.2,
    status: "delivered",
    placedAt: "Completed 7:12 PM",
    lineItems: ["Crispy Chicken Bowl x1"],
  },
];

export function getOrderByRouteKey(routeKey: string): VendorOrder | undefined {
  return orders.find((order) => order.routeKey === routeKey);
}

/** Initial dispatch run – UI-only local updates in Dispatch screen */
export function getInitialDispatchStops(): DispatchStop[] {
  return [
    {
      id: "stop-1",
      customer: "Sofia R.",
      address: "88 Market St",
      etaWindow: "12:40 – 12:55",
      parcels: 2,
      image:
        "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "stop-2",
      customer: "Devon K.",
      address: "450 Grove St",
      etaWindow: "1:05 – 1:20",
      parcels: 1,
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "stop-3",
      customer: "Taylor M.",
      address: "1200 Folsom",
      etaWindow: "1:25 – 1:40",
      parcels: 3,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
  ];
}

export function activeDispatchLegCount(): number {
  return getInitialDispatchStops().length;
}
