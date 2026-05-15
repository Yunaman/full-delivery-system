import { apiFetch } from "@/services/http";
import type { DriverMe } from "@/lib/apiTypes";

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
  current_location?: {
    latitude: string;
    longitude: string;
    updated_at: string;
  } | null;
};

export type DriverUpdateData = Partial<{
  vehicle_type: string;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_color: string;
  license_number: string;
  fullName: string;
  vehicleType: string;
}>;

function toDriverMe(profile: DriverProfile): DriverMe {
  return {
    id: profile.id,
    fullName: profile.name || "Driver",
    phone: profile.phone,
    vehicleType: profile.vehicle_type || "Vehicle",
    verifiedDriver: profile.is_verified,
    documents: [
      { kind: "DRIVER_LICENSE", label: "Driver license", status: profile.license_number ? "Verified" : "Pending" },
      { kind: "VEHICLE_REGISTRATION", label: "Vehicle registration", status: profile.vehicle_number ? "Verified" : "Pending" },
    ],
    phoneVerified: true,
    accountStatus: profile.is_verified ? "Active" : "Pending",
    status: profile.is_available ? "ONLINE" : "OFFLINE",
  };
}

function toApiUpdate(body: DriverUpdateData) {
  return {
    ...(body.vehicle_type ? { vehicle_type: body.vehicle_type } : {}),
    ...(body.vehicleType ? { vehicle_type: body.vehicleType } : {}),
    ...(body.vehicle_number ? { vehicle_number: body.vehicle_number } : {}),
    ...(body.vehicle_model ? { vehicle_model: body.vehicle_model } : {}),
    ...(body.vehicle_color ? { vehicle_color: body.vehicle_color } : {}),
    ...(body.license_number ? { license_number: body.license_number } : {}),
    ...(body.fullName ? { name: body.fullName } : {}),
  };
}

/**
 * Get current driver profile
 * Django endpoint: GET /api/drivers/me/
 */
export async function getMe(token: string) {
  const profile = await apiFetch<DriverProfile>("/api/drivers/me/", { method: "GET", token, retry: 1 });
  return toDriverMe(profile);
}

/**
 * Update driver profile
 * Django endpoint: PATCH /api/drivers/me/
 */
export async function patchMe(token: string, body: DriverUpdateData) {
  const profile = await apiFetch<DriverProfile>("/api/drivers/me/", { method: "PATCH", token, body: toApiUpdate(body) });
  return toDriverMe(profile);
}

/**
 * Update driver availability status
 * Django endpoint: PATCH /api/drivers/update_status/
 * 
 * Maps legacy ONLINE/OFFLINE to is_available boolean
 */
export async function patchStatus(token: string, status: "ONLINE" | "OFFLINE") {
  const isAvailable = status === "ONLINE";
  return apiFetch<{ is_available: boolean; message: string }>(
    "/api/drivers/update_status/", 
    { method: "PATCH", token, body: { is_available: isAvailable } }
  );
}

/**
 * Update driver location
 * Django endpoint: POST /api/drivers/update_location/
 */
export async function postLocation(token: string, pos: { lat: number; lng: number }) {
  return apiFetch<{ message: string; current_location: { latitude: string; longitude: string } }>(
    "/api/drivers/update_location/", 
    { method: "POST", token, body: { latitude: pos.lat, longitude: pos.lng }, retry: 0 }
  );
}

/**
 * Upload driver document
 * Django endpoint: POST /api/drivers/documents/
 */
export async function uploadDocument(
  token: string, 
  documentType: "license" | "insurance" | "registration" | "identity",
  file: File,
  documentNumber?: string
) {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", file);
  if (documentNumber) {
    formData.append("document_number", documentNumber);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/drivers/documents/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload document");
  }

  return response.json();
}
