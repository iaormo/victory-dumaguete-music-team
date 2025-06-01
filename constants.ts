
import { UserRole, User, ServiceType, DateStatusType, Announcement, CustomEvent, SwapRequest, SwapRequestStatus } from './types';

export const APP_NAME = "Victory Dumaguete Music Team";
export const ALL_USERS_LOCAL_STORAGE_KEY = 'allUsersData';
export const AVAILABILITIES_LOCAL_STORAGE_KEY = 'availabilities';
export const CURRENT_USER_LOCAL_STORAGE_KEY = 'currentUser';
export const DATE_STATUS_LOCAL_STORAGE_KEY = 'dateStatuses';
export const ANNOUNCEMENTS_LOCAL_STORAGE_KEY = 'announcementsData';
export const CUSTOM_EVENTS_LOCAL_STORAGE_KEY = 'customEventsData';
export const SWAP_REQUESTS_LOCAL_STORAGE_KEY = 'swapRequestsData';


// Helper function to generate user display names
export const generateUserDisplayName = (originalNameHint: string, roles: UserRole[], isAdmin: boolean): string => {
  let name = originalNameHint;
  const primaryRole = roles.find(r => 
    r === UserRole.VOCALIST || 
    r === UserRole.KEYBOARD || 
    r === UserRole.DRUMS || 
    r === UserRole.ACOUSTIC_GUITAR ||
    r === UserRole.LEAD_GUITAR ||
    r === UserRole.BASS_GUITAR
  );
  
  if (isAdmin && primaryRole) {
    name = `${originalNameHint} (Admin, ${primaryRole})`;
  } else if (isAdmin) {
    name = `${originalNameHint} (Admin)`;
  } else if (primaryRole) {
    name = `${originalNameHint} (${primaryRole})`;
  }
  // Fallback to just originalNameHint if no specific roles to highlight or not admin
  return name;
};


export const MOCK_USERS_RAW_DATA = [
  { id: 'user1', originalNameHint: 'Jose M.', email: 'admin@example.com', roles: [UserRole.ADMIN, UserRole.KEYBOARD], isAdmin: true },
  { id: 'user2', originalNameHint: 'Maria S.', email: 'maria.s@example.com', roles: [UserRole.VOCALIST, UserRole.ACOUSTIC_GUITAR], isAdmin: false },
  { id: 'user3', originalNameHint: 'Chris R.', email: 'chris.r@example.com', roles: [UserRole.DRUMS], isAdmin: false },
  { id: 'user4', originalNameHint: 'Angela T.', email: 'angela.t@example.com', roles: [UserRole.BASS_GUITAR], isAdmin: false },
  { id: 'user5', originalNameHint: 'Miguel G.', email: 'miguel.g@example.com', roles: [UserRole.LEAD_GUITAR], isAdmin: false },
  { id: 'user6', originalNameHint: 'Sofia L.', email: 'sofia.l@example.com', roles: [UserRole.VOCALIST, UserRole.KEYBOARD], isAdmin: false },
  { id: 'user7', originalNameHint: 'David P.', email: 'david.p@example.com', roles: [UserRole.VOCALIST], isAdmin: false }, 
  { id: 'user8', originalNameHint: 'Isabella C.', email: 'isabella.c@example.com', roles: [UserRole.KEYBOARD], isAdmin: false }, 
];

export const MOCK_USERS: User[] = MOCK_USERS_RAW_DATA.map(u => ({
  ...u,
  name: generateUserDisplayName(u.originalNameHint, u.roles, u.isAdmin)
}));


if (MOCK_USERS.length > 0 && !MOCK_USERS.some(u => u.isAdmin)) {
    MOCK_USERS[0].isAdmin = true;
    if (!MOCK_USERS[0].roles.includes(UserRole.ADMIN)) {
        MOCK_USERS[0].roles.push(UserRole.ADMIN);
    }
    MOCK_USERS[0].name = generateUserDisplayName(MOCK_USERS[0].originalNameHint, MOCK_USERS[0].roles, MOCK_USERS[0].isAdmin);

} else if (MOCK_USERS.length === 0) {
    const defaultAdminRoles = [UserRole.ADMIN, UserRole.KEYBOARD];
    MOCK_USERS.push({ 
        id: 'default-admin', 
        originalNameHint: 'Admin User',
        name: generateUserDisplayName("Admin User", defaultAdminRoles, true), 
        email: 'admin@default.com', 
        roles: defaultAdminRoles, 
        isAdmin: true
    });
}

const adminUserForMockAnnouncements = MOCK_USERS.find(u => u.isAdmin)?.name || "Admin";

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'anno1', content: 'Team meeting next Saturday at 2 PM. Please come prepared to discuss the new song list for next month.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), authorName: adminUserForMockAnnouncements },
  { id: 'anno2', content: 'Reminder: All instrumentalists, please check the tuning of your instruments before Sunday service. New song sheets are available in the shared drive.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), authorName: adminUserForMockAnnouncements },
  { id: 'anno3', content: 'Welcome to our new vocalist, Sofia! Please make her feel welcome. Let\'s ensure she has all the necessary materials for upcoming practices.', timestamp: new Date().toISOString(), authorName: adminUserForMockAnnouncements },
];

export const MOCK_CUSTOM_EVENTS: CustomEvent[] = [
    { id: 'ce1', date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], title: 'Special Workshop' },
    { id: 'ce2', date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0], title: 'Youth Night Rehearsal' },
];

export const createOriginalAvailabilityId = (userId: string, date: string, role: UserRole, serviceType?: ServiceType): string => {
  return `${userId}::${date}::${role}::${serviceType || 'default'}`;
};

export const parseOriginalAvailabilityId = (id: string): { userId: string; date: string; role: UserRole; serviceType?: ServiceType } | null => {
  const parts = id.split('::');
  if (parts.length === 4) {
    return {
      userId: parts[0],
      date: parts[1],
      role: parts[2] as UserRole,
      serviceType: parts[3] === 'default' ? undefined : parts[3] as ServiceType,
    };
  }
  return null;
};

export const MOCK_SWAP_REQUESTS: SwapRequest[] = [
  // { 
  //   id: 'swap1', 
  //   requestingUserId: 'user2', // Example: Maria S.
  //   requestingUserName: 'Maria S. (Vocalist)', 
  //   date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], 
  //   role: UserRole.VOCALIST, 
  //   serviceType: ServiceType.MAIN_SERVICE,
  //   reason: 'Sudden family emergency, cannot make it.',
  //   status: SwapRequestStatus.PENDING,
  //   requestedAt: new Date().toISOString(),
  //   originalAvailabilityId: createOriginalAvailabilityId('user2', new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], UserRole.VOCALIST, ServiceType.MAIN_SERVICE)
  // }
];


export const ALL_ROLES: UserRole[] = Object.values(UserRole).filter(role => role !== UserRole.ADMIN);
export const ALL_MANAGEABLE_ROLES: UserRole[] = Object.values(UserRole); 

export const SERVICE_TYPES: ServiceType[] = Object.values(ServiceType);
export const SERVICE_TYPE_ABBREVIATIONS: Record<ServiceType, string> = {
  [ServiceType.MAIN_SERVICE]: "Main",
  [ServiceType.KIDS_AM]: "Kids AM",
  [ServiceType.KIDS_PM]: "Kids PM",
};


export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-slate-500 text-white",
  [UserRole.VOCALIST]: "bg-rose-500 text-white",
  [UserRole.KEYBOARD]: "bg-sky-600 text-white",
  [UserRole.ACOUSTIC_GUITAR]: "bg-amber-500 text-black",
  [UserRole.LEAD_GUITAR]: "bg-orange-500 text-white",
  [UserRole.DRUMS]: "bg-purple-600 text-white",
  [UserRole.BASS_GUITAR]: "bg-indigo-600 text-white",
};

export const DATE_STATUS_STYLES: Record<DateStatusType, { borderColor: string; icon: string; textColor: string; }> = {
  [DateStatusType.LOCKED]: {
    borderColor: 'border-yellow-500',
    icon: '🔒', // Lock emoji
    textColor: 'text-yellow-700',
  },
  [DateStatusType.COMPLETED]: {
    borderColor: 'border-green-500',
    icon: '✔️', // Checkmark emoji
    textColor: 'text-green-700',
  }
};