/**
 * Victory Dumaguete Music Team - TypeScript Types
 * @author Ian James Ormo
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  VOCALIST = 'VOCALIST',
  KEYBOARD = 'KEYBOARD',
  ACOUSTIC_GUITAR = 'ACOUSTIC_GUITAR',
  LEAD_GUITAR = 'LEAD_GUITAR',
  DRUMS = 'DRUMS',
  BASS_GUITAR = 'BASS_GUITAR',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.VOCALIST]: 'Vocalist',
  [UserRole.KEYBOARD]: 'Keyboard',
  [UserRole.ACOUSTIC_GUITAR]: 'Acoustic Guitar',
  [UserRole.LEAD_GUITAR]: 'Lead Guitar',
  [UserRole.DRUMS]: 'Drums',
  [UserRole.BASS_GUITAR]: 'Bass Guitar',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-slate-600 text-white',
  [UserRole.VOCALIST]: 'bg-rose-500 text-white',
  [UserRole.KEYBOARD]: 'bg-sky-600 text-white',
  [UserRole.ACOUSTIC_GUITAR]: 'bg-amber-500 text-white',
  [UserRole.LEAD_GUITAR]: 'bg-orange-500 text-white',
  [UserRole.DRUMS]: 'bg-purple-600 text-white',
  [UserRole.BASS_GUITAR]: 'bg-indigo-600 text-white',
};

export enum ServiceType {
  MAIN_SERVICE = 'MAIN_SERVICE',
  KIDS_AM = 'KIDS_AM',
  KIDS_PM = 'KIDS_PM',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  [ServiceType.MAIN_SERVICE]: 'Main Service',
  [ServiceType.KIDS_AM]: 'Kids AM',
  [ServiceType.KIDS_PM]: 'Kids PM',
};

export enum DateStatusType {
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
}

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  isAdmin: boolean;
  createdAt?: string;
}

export interface Availability {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'roles'>;
  date: string;
  role: UserRole;
  serviceType: ServiceType | null;
  isAvailable: boolean;
}

export interface Announcement {
  id: string;
  content: string;
  imageUrl?: string | null;
  authorId: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  reactions: Reaction[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  reactions: Reaction[];
  replies: Reply[];
  createdAt: string;
}

export interface Reply {
  id: string;
  content: string;
  authorId: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  reactions: Reaction[];
  createdAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  label: string;
  authorId: string;
  author: Pick<User, 'id' | 'displayName'>;
}

export interface CustomEvent {
  id: string;
  date: string;
  title: string;
}

export interface SwapRequest {
  id: string;
  requestingUserId: string;
  requestingUser: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'roles'>;
  date: string;
  role: UserRole;
  serviceType: ServiceType | null;
  reason: string;
  status: SwapRequestStatus;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  resolvedByAdmin?: Pick<User, 'id' | 'displayName'> | null;
  originalAvailabilityId: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'roles'>;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creatorId: string;
  creator: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  members: GroupMember[];
  createdAt: string;
}

export const ALL_ROLES = Object.values(UserRole).filter(r => r !== UserRole.ADMIN);
export const ALL_MANAGEABLE_ROLES = Object.values(UserRole);
export const SERVICE_TYPES = Object.values(ServiceType);

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
