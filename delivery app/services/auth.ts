import { apiFetch } from "@/services/http";

export type DriverProfile = {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_color: string;
  license_number: string;
  is_available: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  balance: number;
};

export type AuthLoginResponse = {
  access: string;
  refresh: string;
  user: DriverProfile;
};

export type OtpStartResponse = {
  phone: string;
  challengeId: string;
};

export type OtpVerifyResponse = {
  token: string;
  driver: {
    id: string;
    fullName: string;
    phone: string;
  };
};

export type AuthRegisterResponse = {
  user: DriverProfile;
  tokens: {
    access: string;
    refresh: string;
  };
};

/**
 * Login with phone/email and password
 * Django JWT endpoint: POST /api/auth/login/
 */
export function login(emailOrPhone: string): Promise<OtpStartResponse>;
export function login(emailOrPhone: string, password: string): Promise<AuthLoginResponse>;
export async function login(emailOrPhone: string, password?: string) {
  if (!password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: emailOrPhone }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }
    return response.json() as Promise<OtpStartResponse>;
  }

  const isEmail = emailOrPhone.includes("@");
  const body = isEmail 
    ? { email: emailOrPhone, password }
    : { phone: emailOrPhone, password };
  
  return apiFetch<AuthLoginResponse>("/api/auth/login/", { 
    method: "POST", 
    body, 
    retry: 0 
  });
}

export async function verifyOtp(phone: string, otp: string) {
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "OTP verification failed" }));
    throw new Error(error.message || "OTP verification failed");
  }
  return response.json() as Promise<OtpVerifyResponse>;
}

/**
 * Register as a driver
 * Django endpoint: POST /api/auth/register/
 */
export async function register(name: string, phone: string, email: string, password: string) {
  return apiFetch<AuthRegisterResponse>("/api/auth/register/", {
    method: "POST",
    body: { name, phone, email, password, password_confirm: password, role: "driver" },
    retry: 0
  });
}

/**
 * Refresh access token
 * Django endpoint: POST /api/auth/refresh/
 */
export async function refreshToken(refreshToken: string) {
  return apiFetch<{ access: string }>("/api/auth/refresh/", {
    method: "POST",
    body: { refresh: refreshToken },
    retry: 0
  });
}

/**
 * Get current driver profile
 * Django endpoint: GET /api/drivers/me/
 */
export async function getDriverProfile(token: string) {
  return apiFetch<DriverProfile>("/api/drivers/me/", {
    method: "GET",
    token,
    retry: 1
  });
}

/**
 * Update driver availability status
 * Django endpoint: POST /api/drivers/update_status/
 */
export async function updateDriverStatus(token: string, isAvailable: boolean) {
  return apiFetch<{ is_available: boolean; message: string }>("/api/drivers/update_status/", {
    method: "PATCH",
    token,
    body: { is_available: isAvailable },
    retry: 1
  });
}

/**
 * Update driver location
 * Django endpoint: POST /api/drivers/update_location/
 */
export async function updateDriverLocation(token: string, latitude: number, longitude: number) {
  return apiFetch<{ message: string; current_location: { latitude: string; longitude: string } }>(
    "/api/drivers/update_location/",
    {
      method: "POST",
      token,
      body: { latitude, longitude },
      retry: 1
    }
  );
}

/**
 * Logout - blacklist refresh token
 * Django endpoint: POST /api/auth/users/me/logout/
 */
export async function logout(token: string, refreshToken: string) {
  return apiFetch<{ detail: string }>("/api/auth/users/me/logout/", {
    method: "POST",
    token,
    body: { refresh: refreshToken },
    retry: 0
  });
}
