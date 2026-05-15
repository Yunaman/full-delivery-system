export type LatLng = { lat: number; lng: number };

export type DriverStatus = "ONLINE" | "OFFLINE";

export type OrderStatus =
  | "Incoming"
  | "Accepted"
  | "Arrived"
  | "Picked Up"
  | "Delivered"
  | "Rejected"
  | "Expired";

export type OrderStage = "INCOMING" | "ACTIVE" | "PAST";

export type Order = {
  id: string;
  createdAt: number;
  updatedAt: number;
  restaurantName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLocation: LatLng;
  dropoffLocation: LatLng;
  distanceKm: number;
  earningsBirr: number;
  customerName: string;
  status: OrderStatus;
  stage: OrderStage;
};

