/**
 * Customer App API Client for Django Backend
 * Full integration with Delivery Platform API
 */

import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@delivery/shared/auth";
import { ApiError, apiRequest } from "@delivery/shared/http";

// Error handling
export { ApiError };

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface Vendor {
  id: string;
  shop_name: string;
  slug: string;
  vendor_type: string;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  is_open: boolean;
  is_open_now: boolean;
  rating: number;
  total_reviews: number;
  delivery_radius: number;
  minimum_order_amount: number;
  delivery_fee: number;
  preparation_time: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  current_price: number;
  discount_percentage: number;
  category: string;
  category_name: string;
  vendor: string;
  vendor_name: string;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  in_stock: boolean;
  rating: number;
  preparation_time: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price_adjustment: number;
  final_price: number;
  stock_quantity: number;
  is_available: boolean;
}

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  special_instructions?: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string;
}

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

export interface Order {
  id: string;
  order_number: string;
  vendor: Vendor;
  vendor_name: string;
  driver_name: string | null;
  status: OrderStatus;
  status_display: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_price: number;
  items: OrderItem[];
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  contact_name: string;
  contact_phone: string;
  notes: string;
  estimated_preparation_time: number;
  estimated_delivery_time: number | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  can_cancel: boolean;
}

export interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface Payment {
  id: string;
  order: string;
  amount: number;
  method: string;
  status: string;
  transaction_id: string;
  paid_at: string | null;
}

// API Client Class
class CustomerAPI {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
    setAuthTokens({ access: token });
  }

  getAccessToken(): string | null {
    return this.accessToken || getAccessToken();
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    return apiRequest<T>(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
  }

  // Authentication
  async login(emailOrPhone: string, password: string): Promise<AuthResponse> {
    const isEmail = emailOrPhone.includes("@");
    const body = isEmail 
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password };

    const data = await this.request<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const accessToken = data.access || data.tokens?.access;
    const refreshToken = data.refresh || data.tokens?.refresh;
    
    if (accessToken) setAuthTokens({ access: accessToken, refresh: refreshToken });

    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        ...userData,
        password_confirm: userData.password,
        role: "customer",
      }),
    });

    const accessToken = data.access || data.tokens?.access;
    const refreshToken = data.refresh || data.tokens?.refresh;
    
    if (accessToken) setAuthTokens({ access: accessToken, refresh: refreshToken });

    return data;
  }

  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const data = await this.request<{ access: string }>("/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });

    this.setAccessToken(data.access);
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await this.request("/auth/users/me/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch {
        // Ignore errors on logout
      }
    }

    this.accessToken = null;
    clearAuthTokens();
  }

  async getProfile(): Promise<User> {
    return this.request<User>("/auth/users/me/", { method: "GET" });
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>("/auth/users/me/update_profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Vendors
  async getVendors(params?: {
    type?: string;
    city?: string;
    lat?: number;
    lng?: number;
    is_open?: boolean;
  }): Promise<{ results: Vendor[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.city) searchParams.append("city", params.city);
    if (params?.lat) searchParams.append("lat", params.lat.toString());
    if (params?.lng) searchParams.append("lng", params.lng.toString());
    if (params?.is_open !== undefined) searchParams.append("is_open", params.is_open.toString());

    return this.request(`/vendors/?${searchParams}`, { method: "GET" });
  }

  async getVendor(id: string): Promise<Vendor> {
    return this.request<Vendor>(`/vendors/${id}/`, { method: "GET" });
  }

  async getVendorReviews(vendorId: string): Promise<{
    results: Array<{
      id: string;
      customer_name: string;
      rating: number;
      comment: string;
      created_at: string;
    }>;
  }> {
    return this.request(`/vendors/${vendorId}/reviews/`, { method: "GET" });
  }

  // Products
  async getProducts(params?: {
    vendor?: string;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    is_available?: boolean;
  }): Promise<{ results: Product[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.vendor) searchParams.append("vendor", params.vendor);
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.min_price) searchParams.append("min_price", params.min_price.toString());
    if (params?.max_price) searchParams.append("max_price", params.max_price.toString());
    if (params?.is_available) searchParams.append("is_available", "true");

    return this.request(`/products/?${searchParams}`, { method: "GET" });
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}/`, { method: "GET" });
  }

  async searchProducts(query: string): Promise<{ results: Product[] }> {
    return this.request(`/products/search/?query=${encodeURIComponent(query)}`, { method: "GET" });
  }

  async getFeaturedProducts(): Promise<{ results: Product[] }> {
    return this.request(`/products/featured/`, { method: "GET" });
  }

  async getCategories(): Promise<{ id: string; name: string; slug: string; product_count: number }[]> {
    return this.request(`/products/categories/`, { method: "GET" });
  }

  // Orders
  async createOrder(orderData: {
    vendor_id: string;
    items: CartItem[];
    delivery_address: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    contact_name?: string;
    contact_phone?: string;
    payment_method: string;
    notes?: string;
  }): Promise<Order> {
    return this.request<Order>("/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params?: { status?: string }): Promise<{ results: Order[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);

    return this.request(`/orders/?${searchParams}`, { method: "GET" });
  }

  async getActiveOrders(): Promise<{ results: Order[] }> {
    return this.request("/orders/active/", { method: "GET" });
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/`, { method: "GET" });
  }

  async cancelOrder(id: string, reason: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async addOrderReview(orderId: string, rating: number, comment: string): Promise<void> {
    await this.request(`/orders/${orderId}/add_review/`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Addresses
  async getAddresses(): Promise<{ results: Address[] }> {
    return this.request("/auth/addresses/", { method: "GET" });
  }

  async createAddress(addressData: Omit<Address, "id">): Promise<Address> {
    return this.request<Address>("/auth/addresses/", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(id: string, addressData: Partial<Address>): Promise<Address> {
    return this.request<Address>(`/auth/addresses/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(id: string): Promise<void> {
    await this.request(`/auth/addresses/${id}/`, { method: "DELETE" });
  }

  // Payments
  async createPayment(orderId: string, method: string): Promise<Payment> {
    return this.request<Payment>("/payments/", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, method }),
    });
  }

  async getPaymentByOrder(orderId: string): Promise<Payment> {
    return this.request<Payment>(`/payments/by_order/?order_id=${orderId}`, { method: "GET" });
  }

  // Analytics
  async getDashboardStats(): Promise<{
    summary: {
      total_orders: number;
      active_orders: number;
      total_spent: number;
      favorite_vendor: { id: string; name: string; orders: number } | null;
    };
    recent_orders: Order[];
  }> {
    return this.request("/analytics/dashboard/", { method: "GET" });
  }

  // Notifications
  async getNotifications(): Promise<{
    results: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }>;
  }> {
    return this.request("/notifications/", { method: "GET" });
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/mark_read/`, { method: "POST" });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request("/notifications/mark_all_read/", { method: "POST" });
  }
}

// Export singleton instance
export const api = new CustomerAPI();
export default api;
