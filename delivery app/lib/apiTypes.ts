export type DocumentStatus = "Verified" | "Pending" | "Rejected";
export type AccountStatus = "Active" | "Pending";

export type DriverDocument = {
  kind: "DRIVER_LICENSE" | "ID_CARD" | "VEHICLE_REGISTRATION";
  label: string;
  status: DocumentStatus;
};

export type DriverMe = {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  verifiedDriver: boolean;
  documents: DriverDocument[];
  phoneVerified: boolean;
  accountStatus: AccountStatus;
  status: "ONLINE" | "OFFLINE";
};

