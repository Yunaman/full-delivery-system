export type PaginatedResponse<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

export type UserRole = "customer" | "vendor" | "driver" | "admin";

export type UserSummary = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole | string;
};

export type AuthResponse<TUser = UserSummary> = {
  access?: string;
  refresh?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
  user: TUser;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";
