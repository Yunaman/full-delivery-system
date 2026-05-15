/**
 * Django Backend API Integration for Vendor App
 * Connects to Django Delivery Platform Backend
 */

import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@delivery/shared/auth";
import { apiBaseUrl } from "@delivery/shared/env";

export interface DjangoVendor {
  id: number;
  user_name: string;
  shop_name: string;
  vendor_type: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_open: boolean;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  delivery_fee: number;
  free_delivery_above: number;
  estimated_delivery_time: number;
  logo: string;
  working_hours: Record<string, { start: string; end: string }>;
}

export interface DjangoProduct {
  id: number;
  vendor: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  image: string;
  category: string;
  stock_quantity: number;
  is_available: boolean;
  rating: number;
  total_orders: number;
  current_price: number;
  discount_percentage: number;
  is_in_stock: boolean;
  is_low_stock: boolean;
}

export interface DjangoOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  total_price: number;
  delivery_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  estimated_delivery_time: string | null;
  items: DjangoOrderItem[];
}

export interface DjangoOrderItem {
  id: number;
  product: DjangoProduct;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
  special_instructions: string;
}

export interface DjangoVendorStats {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
  active_orders: number;
}

export interface DjangoProductStats {
  total_products: number;
  available_products: number;
  out_of_stock: number;
  low_stock: number;
  top_selling: DjangoProduct[];
  recent_orders: number;
}

/**
 * Django Backend API Client for Vendor App
 * Fully integrated with Django Delivery Platform
 */
class DjangoVendorAPI {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = apiBaseUrl();
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    setAuthTokens({ access: token });
  }

  getAccessToken(): string | null {
    return this.accessToken || getAccessToken();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.accessToken = data.access;
    
    // Store tokens
    setAuthTokens({ access: data.access, refresh: data.refresh });
    
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirm: string;
    role: string;
  }) {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async logout() {
    clearAuthTokens();
    this.accessToken = null;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.setAccessToken(data.access);
    return data;
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  private async authenticatedRequest<T>(
    url: string, 
    options: RequestInit
  ): Promise<T> {
    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...(options.headers || {}),
        },
      });

      // If unauthorized, try refreshing token
      if (response.status === 401) {
        try {
          await this.refreshToken();
          // Retry with new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...this.getAuthHeaders(),
              ...(options.headers || {}),
            },
          });
        } catch {
          // Refresh failed, redirect to login
          this.logout();
          if (typeof window !== 'undefined') window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed (${response.status})`);
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Vendor Profile
  
  /**
   * Get vendor profile for current user
   * Uses query param my_vendors=true to get own vendor
   */
  async getMyVendor(): Promise<DjangoVendor> {
    interface VendorListResponse {
      results: DjangoVendor[];
      count: number;
    }
    
    const data = await this.authenticatedRequest<VendorListResponse | DjangoVendor[]>(
      `${this.baseURL}/vendors/?my_vendors=true`,
      { method: 'GET' }
    );
    
    // Handle paginated response or array
    const vendors = Array.isArray(data) ? data : data.results;
    if (!vendors || vendors.length === 0) {
      throw new Error('No vendor profile found');
    }
    
    return vendors[0];
  }

  /**
   * Get vendor by ID
   */
  async getVendor(vendorId: string): Promise<DjangoVendor> {
    return this.authenticatedRequest<DjangoVendor>(
      `${this.baseURL}/vendors/${vendorId}/`,
      { method: 'GET' }
    );
  }

  /**
   * Create new vendor profile
   * POST /api/vendors/
   */
  async createVendor(vendorData: {
    shop_name: string;
    vendor_type: string;
    description?: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    working_hours?: Record<string, { open: string; close: string }>;
  }) {
    return this.authenticatedRequest<DjangoVendor>(
      `${this.baseURL}/vendors/`,
      { 
        method: 'POST', 
        body: JSON.stringify(vendorData)
      }
    );
  }

  /**
   * Update vendor profile
   * PATCH /api/vendors/{id}/
   */
  async updateVendor(vendorId: string, vendorData: Partial<DjangoVendor>) {
    return this.authenticatedRequest<DjangoVendor>(
      `${this.baseURL}/vendors/${vendorId}/`,
      { 
        method: 'PATCH', 
        body: JSON.stringify(vendorData)
      }
    );
  }

  /**
   * Toggle vendor open/closed status
   * PATCH /api/vendors/{id}/
   */
  async updateVendorStatus(vendorId: string, isOpen: boolean) {
    return this.authenticatedRequest<DjangoVendor>(
      `${this.baseURL}/vendors/${vendorId}/`,
      { 
        method: 'PATCH', 
        body: JSON.stringify({ is_open: isOpen })
      }
    );
  }

  // Products
  
  /**
   * Get products for current vendor
   * GET /api/products/?my_products=true
   */
  async getMyProducts(params?: {
    category?: string;
    is_available?: boolean;
    search?: string;
  }): Promise<DjangoProduct[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('my_products', 'true');
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.is_available !== undefined) searchParams.append('is_available', params.is_available.toString());
    if (params?.search) searchParams.append('search', params.search);

    interface ProductListResponse {
      results: DjangoProduct[];
      count: number;
    }

    const data = await this.authenticatedRequest<ProductListResponse | DjangoProduct[]>(
      `${this.baseURL}/products/?${searchParams}`,
      { method: 'GET' }
    );
    
    return Array.isArray(data) ? data : data.results || [];
  }

  /**
   * Get product by ID
   * GET /api/products/{id}/
   */
  async getProduct(productId: string): Promise<DjangoProduct> {
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/${productId}/`,
      { method: 'GET' }
    );
  }

  /**
   * Create new product
   * POST /api/products/
   */
  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    category_id?: string;
    stock_quantity?: number;
    is_available?: boolean;
    preparation_time?: number;
    image?: File;
  }) {
    // If image provided, use FormData
    if (productData.image) {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'image') {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
      formData.append('image', productData.image);

      const response = await fetch(`${this.baseURL}/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create product');
      }

      return response.json();
    }

    // JSON request without image
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/`,
      { 
        method: 'POST', 
        body: JSON.stringify(productData)
      }
    );
  }

  /**
   * Update product
   * PATCH /api/products/{id}/
   */
  async updateProduct(productId: string, productData: Partial<DjangoProduct>) {
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/${productId}/`,
      { 
        method: 'PATCH', 
        body: JSON.stringify(productData)
      }
    );
  }

  /**
   * Delete product
   * DELETE /api/products/{id}/
   */
  async deleteProduct(productId: string) {
    return this.authenticatedRequest<void>(
      `${this.baseURL}/products/${productId}/`,
      { method: 'DELETE' }
    );
  }

  /**
   * Update product stock/inventory
   * PATCH /api/products/{id}/
   */
  async updateProductInventory(productId: string, stockQuantity: number) {
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/${productId}/`,
      { 
        method: 'PATCH', 
        body: JSON.stringify({ stock_quantity: stockQuantity })
      }
    );
  }

  /**
   * Toggle product availability
   * PATCH /api/products/{id}/
   */
  async toggleProductAvailability(productId: string, isAvailable: boolean) {
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/${productId}/`,
      { 
        method: 'PATCH', 
        body: JSON.stringify({ is_available: isAvailable })
      }
    );
  }

  /**
   * Add product variant
   * POST /api/products/{id}/add_variant/
   */
  async addProductVariant(productId: string, variant: {
    name: string;
    price_adjustment: number;
    stock_quantity: number;
  }) {
    return this.authenticatedRequest<DjangoProduct>(
      `${this.baseURL}/products/${productId}/add_variant/`,
      { 
        method: 'POST', 
        body: JSON.stringify(variant)
      }
    );
  }

  /**
   * Get product categories
   * GET /api/products/categories/
   */
  async getProductCategories() {
    return this.authenticatedRequest<{ id: string; name: string; slug: string }[]>(
      `${this.baseURL}/products/categories/`,
      { method: 'GET' }
    );
  }

  // Orders
  
  /**
   * Get orders for vendor
   * GET /api/orders/
   */
  async getMyOrders(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<DjangoOrder[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.append('status', params.status);
    if (params?.start_date) searchParams.append('created_at__gte', params.start_date);
    if (params?.end_date) searchParams.append('created_at__lte', params.end_date);

    interface OrderListResponse {
      results: DjangoOrder[];
      count: number;
    }

    const data = await this.authenticatedRequest<OrderListResponse | DjangoOrder[]>(
      `${this.baseURL}/orders/?${searchParams}`,
      { method: 'GET' }
    );
    
    return Array.isArray(data) ? data : data.results || [];
  }

  /**
   * Get order details
   * GET /api/orders/{id}/
   */
  async getOrder(orderId: string): Promise<DjangoOrder> {
    return this.authenticatedRequest<DjangoOrder>(
      `${this.baseURL}/orders/${orderId}/`,
      { method: 'GET' }
    );
  }

  /**
   * Update order status
   * POST /api/orders/{id}/update_status/
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    return this.authenticatedRequest<DjangoOrder>(
      `${this.baseURL}/orders/${orderId}/update_status/`,
      { 
        method: 'POST', 
        body: JSON.stringify({ status, notes: notes || '' })
      }
    );
  }

  /**
   * Assign driver to order
   * POST /api/orders/{id}/assign_driver/
   */
  async assignDriver(orderId: string, driverId: string) {
    return this.authenticatedRequest<DjangoOrder>(
      `${this.baseURL}/orders/${orderId}/assign_driver/`,
      { 
        method: 'POST', 
        body: JSON.stringify({ driver_id: driverId })
      }
    );
  }

  /**
   * Get available drivers
   * GET /api/drivers/?available_only=true
   */
  async getAvailableDrivers(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('available_only', 'true');
    
    if (params?.latitude) searchParams.append('lat', params.latitude.toString());
    if (params?.longitude) searchParams.append('lng', params.longitude.toString());

    interface DriverListResponse {
      results: Array<{
        id: string;
        name: string;
        phone: string;
        vehicle_type: string;
        rating: number;
        total_deliveries: number;
        current_location?: {
          latitude: string;
          longitude: string;
        };
      }>;
      count: number;
    }

    return this.authenticatedRequest<DriverListResponse>(
      `${this.baseURL}/drivers/?${searchParams}`,
      { method: 'GET' }
    );
  }

  // Analytics & Stats
  
  /**
   * Get vendor dashboard analytics
   * GET /api/analytics/dashboard/
   */
  async getVendorStats(): Promise<{
    summary: {
      total_orders: number;
      today_orders: number;
      total_revenue: number;
      today_revenue: number;
      total_customers: number;
      average_order_value: number;
      rating: number;
    };
    order_status_breakdown: Record<string, number>;
    popular_products: Array<{ product__name: string; total_sold: number }>;
  }> {
    return this.authenticatedRequest(
      `${this.baseURL}/analytics/dashboard/`,
      { method: 'GET' }
    );
  }

  /**
   * Get revenue analytics
   * GET /api/analytics/revenue/
   */
  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('start_date', startDate);
    if (endDate) searchParams.append('end_date', endDate);

    return this.authenticatedRequest<{
      date_range: { start: string; end: string };
      summary: {
        total_revenue: number;
        total_orders: number;
        avg_order_value: number;
      };
      daily_breakdown: Array<{ date: string; revenue: number; orders: number }>;
    }>(
      `${this.baseURL}/analytics/revenue/?${searchParams}`,
      { method: 'GET' }
    );
  }

  // Reviews
  
  /**
   * Get vendor reviews
   * GET /api/vendors/{id}/reviews/
   */
  async getVendorReviews(vendorId: string) {
    return this.authenticatedRequest<{
      results: Array<{
        id: string;
        customer_name: string;
        rating: number;
        comment: string;
        created_at: string;
      }>;
    }>(
      `${this.baseURL}/vendors/${vendorId}/reviews/`,
      { method: 'GET' }
    );
  }

  // Documents
  
  /**
   * Upload vendor document (logo, license, etc)
   */
  async uploadVendorDocument(vendorId: string, documentType: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    const response = await fetch(`${this.baseURL}/vendors/${vendorId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
  }
}

export const djangoVendorAPI = new DjangoVendorAPI();
export default djangoVendorAPI;
