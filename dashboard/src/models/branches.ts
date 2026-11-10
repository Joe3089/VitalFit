export type BranchInstructor = {
  instructorId: string;
  status: "Active" | "Inactive";
  user_id?: string;
  name?: string;
  specialty?: string;
};

export type BranchService = {
  serviceId: string;
  isVisible: boolean;
  maxCapacity: number;
  priceForMember: number;
  priceForNonMember: number;
  name?: string;
  description?: string;
};

export type BranchInventoryItem = {
  inventoryId: string;
  equipmentId: string;
  serialNumber?: string | null;
  status: "Available" | "InMaintenance" | "OutOfService";
  acquisitionDate?: string | null;
  name?: string;
  category?: string;
};

export type Branches = {
  id: string;
  name: string;
  taxId: string;
  address?: string | null;
  countryId: string;
  stateId: string;
  state: string;
  cityId: string;
  latitude?: number | null;
  longitude?: number | null;
  maxCapacity?: number | null;
  phone?: string | null;
  status: "active" | "inactive" | "maintenance";
  administrator?: string;
  city?: string;
  country?: string;
  operatingHours?: BranchOperatingHours[];
  paymethods?: string[] | null;
  instructors: BranchInstructor[];
  services: BranchService[];
  inventory: BranchInventoryItem[];
};

export type BranchPayload = {
  name: string;
  taxId: string;
  cityId: string;
  countryId: string;
  stateId: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  maxCapacity?: number | null;
  phone?: string | null;
  status: "active" | "inactive" | "maintenance";
  administrator?: string;
  operatingHours: BranchOperatingHours[];
  paymethods?: string[] | null;
  instructors: BranchInstructor[];
  services: BranchService[];
  inventory: BranchInventoryItem[];
};

export type CreateBranchPayload = BranchPayload;
export type ModifyBranchPayload = BranchPayload;

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type BranchOperatingHours = {
  hourId?: string;
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};
