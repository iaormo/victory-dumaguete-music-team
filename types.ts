
export enum UserRole {
  ADMIN = "Admin",
  VOCALIST = "Vocalist",
  KEYBOARD = "Keyboard",
  ACOUSTIC_GUITAR = "Acoustic Guitar",
  LEAD_GUITAR = "Lead Guitar",
  DRUMS = "Drums",
  BASS_GUITAR = "Bass Guitar",
}

export enum ServiceType {
  MAIN_SERVICE = "Main Service",
  KIDS_AM = "Kids AM",
  KIDS_PM = "Kids PM",
}

export enum DateStatusType {
  LOCKED = "Locked",
  COMPLETED = "Completed",
}

export interface User {
  id: string;
  name: string; // Display name, combination of original hint and key roles
  originalNameHint: string; 
  email: string; 
  roles: UserRole[]; 
  isAdmin: boolean;
}

export interface Availability {
  userId: string;
  date: string; // YYYY-MM-DD format
  isAvailable: boolean;
  role: UserRole; 
  serviceType?: ServiceType; // Relevant for Sundays
}

export interface ScheduledEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  assignedUsers: { userId: string; role: UserRole; serviceType?: ServiceType }[];
}

// For function prop type, if needed for updating date status
export type UpdateDateStatusFn = (date: string, status: DateStatusType | null) => void;

export interface Announcement {
  id: string;
  content: string;
  timestamp: string; // ISO string
  authorName: string;
}

export interface CustomEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
}

export enum SwapRequestStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface SwapRequest {
  id: string;
  requestingUserId: string;
  requestingUserName: string;
  date: string; // YYYY-MM-DD of the original slot
  role: UserRole;
  serviceType?: ServiceType;
  reason: string;
  status: SwapRequestStatus;
  requestedAt: string; // ISO timestamp
  adminNotes?: string;
  resolvedAt?: string; // ISO timestamp
  resolvedByAdminId?: string;
  originalAvailabilityId: string; // Unique identifier for the specific availability slot being swapped
                                  // e.g., `userId::date::role::serviceType`
}