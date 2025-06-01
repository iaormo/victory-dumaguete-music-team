import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Availability, UserRole, ServiceType, DateStatusType, UpdateDateStatusFn, Announcement, CustomEvent, SwapRequest, SwapRequestStatus } from '../types';
import { ALL_ROLES, MONTH_NAMES, APP_NAME, SERVICE_TYPE_ABBREVIATIONS, createOriginalAvailabilityId } from '../constants'; 
import CalendarGrid from './CalendarGrid';
import AvailabilityModal from './AvailabilityModal';
import Button from './Button';
import RoleBadge from './RoleBadge';
import EditUserRolesModal from './EditUserRolesModal';
import AddUserModal from './AddUserModal';
import AnnouncementBoard from './AnnouncementBoard';
import AddAnnouncementModal from './AddAnnouncementModal';
import EmbedCodeModal from './EmbedCodeModal'; 
import ManageCustomEventsModal from './ManageCustomEventsModal';
import SwapRequestModal from './SwapRequestModal';
import AdminResolveSwapRequestModal from './AdminResolveSwapRequestModal';


interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  allUsers: User[];
  availabilities: Availability[]; 
  onUpdateUserRoles: (userId: string, newRoles: UserRole[]) => void;
  onUpdateAvailability: ( 
    userIdToUpdate: string,
    dateString: string,
    role: UserRole,
    serviceType: ServiceType | undefined,
    isNowAvailable: boolean
  ) => void;
  dateStatuses: Record<string, DateStatusType | undefined>;
  onUpdateDateStatus: UpdateDateStatusFn;
  onAddNewUser: (originalNameHint: string, email: string, roles: UserRole[]) => User | null;
  announcements: Announcement[];
  onAddAnnouncement: (content: string) => void;
  customEvents: CustomEvent[];
  onAddCustomEvent: (date: string, title: string) => CustomEvent | null;
  onDeleteCustomEvent: (eventId: string) => void;
  swapRequests: SwapRequest[];
  onAddSwapRequest: (
    requestingUserId: string,
    requestingUserName: string,
    date: string,
    role: UserRole,
    serviceType: ServiceType | undefined,
    reason: string,
    originalAvailabilityId: string
  ) => SwapRequest | null;
  onUpdateSwapRequestStatus: (
    swapRequestId: string,
    newStatus: SwapRequestStatus.APPROVED, // Only approved status is handled here now for assignment
    adminNotes?: string,
    replacementUserId?: string | null
  ) => void;
}

// Icons
const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const UserPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const ArrowPathRoundedSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);


const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogout,
  allUsers,
  availabilities,
  onUpdateUserRoles,
  onUpdateAvailability,
  dateStatuses,
  onUpdateDateStatus,
  onAddNewUser,
  announcements,
  onAddAnnouncement,
  customEvents,
  onAddCustomEvent,
  onDeleteCustomEvent,
  swapRequests,
  onAddSwapRequest,
  onUpdateSwapRequestStatus,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  
  const [isEditRolesModalOpen, setIsEditRolesModalOpen] = useState(false);
  const [userToEditRoles, setUserToEditRoles] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | null>(null);
  const [isAddAnnouncementModalOpen, setIsAddAnnouncementModalOpen] = useState(false);
  const [isEmbedCodeModalOpen, setIsEmbedCodeModalOpen] = useState(false); 
  const [isManageCustomEventsModalOpen, setIsManageCustomEventsModalOpen] = useState(false);
  
  const [isSwapRequestModalOpen, setIsSwapRequestModalOpen] = useState(false);
  const [slotToRequestSwapFor, setSlotToRequestSwapFor] = useState<{ date: string, role: UserRole, serviceType?: ServiceType, originalAvailabilityId: string } | null>(null);

  const [isAdminResolveSwapModalOpen, setIsAdminResolveSwapModalOpen] = useState(false);
  const [swapRequestToResolve, setSwapRequestToResolve] = useState<SwapRequest | null>(null);


  const handleDateClick = (date: Date) => {
    setSelectedDateForModal(date);
    setIsAvailabilityModalOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleUpdateCurrentUserAvailability = useCallback((dateString: string, role: UserRole, serviceType: ServiceType | undefined, isNowAvailable: boolean) => {
    onUpdateAvailability(currentUser.id, dateString, role, serviceType, isNowAvailable);
  }, [currentUser.id, onUpdateAvailability]);


  const handleAdminModifyAvailability = useCallback((userId: string, dateString: string, role: UserRole, serviceType: ServiceType | undefined, isNowAvailable: boolean) => {
      onUpdateAvailability(userId, dateString, role, serviceType, isNowAvailable);
  }, [onUpdateAvailability]);


  const openEditRolesModal = (user: User) => {
    setUserToEditRoles(user);
    setIsEditRolesModalOpen(true);
  };
  
  const handleSaveUserRoles = (userId: string, newRoles: UserRole[]) => {
      onUpdateUserRoles(userId, newRoles);
      setIsEditRolesModalOpen(false);
      setUserToEditRoles(null);
  };

  const handleSaveNewUser = (originalNameHint: string, email: string, roles: UserRole[]): boolean => {
    const newUser = onAddNewUser(originalNameHint, email, roles);
    if (newUser) {
      setIsAddUserModalOpen(false);
      return true;
    }
    return false; 
  };
  
  const handleExportMonthScheduleCSV = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let csvContent = "Date,User Name,Role,Service Type,Event Title\n";

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const dateString = cellDate.toISOString().split('T')[0];
      
      const dayAvailabilities = availabilities.filter(av => 
        av.date === dateString && 
        av.isAvailable &&
        (filterRole ? av.role === filterRole : true)
      );
      
      const customEventOnDay = customEvents.find(event => event.date === dateString);

      if (dayAvailabilities.length > 0) {
        dayAvailabilities.forEach(av => {
          const user = allUsers.find(u => u.id === av.userId);
          if (user) {
            const serviceName = av.serviceType ? SERVICE_TYPE_ABBREVIATIONS[av.serviceType] : 'N/A';
            csvContent += `${dateString},"${user.name.replace(/"/g, '""')}","${av.role}","${serviceName}","${customEventOnDay ? customEventOnDay.title.replace(/"/g, '""') : ''}"\n`;
          }
        });
      } else if (customEventOnDay) {
         // Log custom event even if no one is scheduled yet
         csvContent += `${dateString},"","","","${customEventOnDay.title.replace(/"/g, '""')}"\n`;
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `schedule_${MONTH_NAMES[month]}_${year}${filterRole ? '_'+filterRole.replace(/\s+/g, '') : ''}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getSelectedDayAvailabilitiesForModal = () => {
    if (!selectedDateForModal) return [];
    const dateString = selectedDateForModal.toISOString().split('T')[0];
    return availabilities.filter(av => av.date === dateString && av.isAvailable && (filterRole ? av.role === filterRole : true));
  };

  const getCurrentUserAvailabilitiesForModalDay = () => {
    if (!selectedDateForModal || !currentUser) return [];
    const dateString = selectedDateForModal.toISOString().split('T')[0];
    return availabilities.filter(av => 
        av.userId === currentUser.id && 
        av.date === dateString &&
        av.isAvailable
    );
  };

  const handlePostAnnouncement = (content: string) => {
    onAddAnnouncement(content);
    setIsAddAnnouncementModalOpen(false);
  };

  const handleOpenSwapRequestModal = (date: string, role: UserRole, serviceType?: ServiceType) => {
    const originalAvailabilityId = createOriginalAvailabilityId(currentUser.id, date, role, serviceType);
    setSlotToRequestSwapFor({ date, role, serviceType, originalAvailabilityId });
    setIsAvailabilityModalOpen(false); // Close availability modal first
    setIsSwapRequestModalOpen(true);
  };

  const handleSubmitSwapRequest = (reason: string) => {
    if (slotToRequestSwapFor && currentUser) {
      onAddSwapRequest(
        currentUser.id,
        currentUser.name,
        slotToRequestSwapFor.date,
        slotToRequestSwapFor.role,
        slotToRequestSwapFor.serviceType,
        reason,
        slotToRequestSwapFor.originalAvailabilityId
      );
    }
    setIsSwapRequestModalOpen(false);
    setSlotToRequestSwapFor(null);
  };

  const handleOpenAdminResolveSwapModal = (request: SwapRequest) => {
    setSwapRequestToResolve(request);
    setIsAdminResolveSwapModalOpen(true);
  };

  const handleAdminResolveSwapRequest = (
    requestId: string,
    adminNotes?: string,
    replacementUserId?: string | null
  ) => {
    onUpdateSwapRequestStatus(requestId, SwapRequestStatus.APPROVED, adminNotes, replacementUserId);
    setIsAdminResolveSwapModalOpen(false);
    setSwapRequestToResolve(null);
  };

  const pendingSwapRequestsCount = useMemo(() => {
    return swapRequests.filter(sr => sr.status === SwapRequestStatus.PENDING).length;
  }, [swapRequests]);
  
  const formatSwapRequestTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };


  return (
    <div className="min-h-screen bg-gray-200 p-4 sm:p-6 md:p-8">
      <header className="mb-6 md:mb-8 bg-blue-700 shadow-lg rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-0">{APP_NAME}</h1>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-blue-100 font-medium">{currentUser.name}</p>
              <div className="flex flex-wrap justify-end max-w-xs">
                {currentUser.roles.map(role => <RoleBadge key={role} role={role} className="mt-1 mr-1 opacity-90"/>)}
              </div>
            </div>
            <Button onClick={onLogout} variant="secondary" size="sm" className="bg-blue-500 hover:bg-blue-400 text-white border border-blue-400">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-6 p-4 sm:p-6 bg-white shadow-md rounded-lg flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevMonth} variant="ghost" size="sm" aria-label="Previous month" leftIcon={<ChevronLeftIcon />} />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 w-40 sm:w-48 text-center">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button onClick={handleNextMonth} variant="ghost" size="sm" aria-label="Next month" rightIcon={<ChevronRightIcon />} />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
           <div className="relative w-full sm:w-auto">
             <select
                value={filterRole || ''}
                onChange={(e) => setFilterRole(e.target.value as UserRole | null)}
                className="appearance-none w-full sm:w-48 p-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Roles</option>
                {ALL_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <FilterIcon className="text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
           </div>
           {currentUser.isAdmin && (
             <div className="flex space-x-2 flex-wrap justify-center gap-2 sm:gap-0">
                <Button onClick={handleExportMonthScheduleCSV} variant="ghost" size="sm" leftIcon={<DownloadIcon />}>
                    Export CSV
                </Button>
                <Button onClick={() => setIsEmbedCodeModalOpen(true)} variant="ghost" size="sm" leftIcon={<CodeBracketIcon />} aria-label="Generate Embed Code">
                    Embed
                </Button>
                <Button onClick={() => setIsManageCustomEventsModalOpen(true)} variant="ghost" size="sm" leftIcon={<CalendarDaysIcon />} aria-label="Manage Custom Events">
                    Events
                </Button>
             </div>
           )}
        </div>
      </div>

      <CalendarGrid
        currentDate={currentDate}
        availabilities={availabilities}
        onDateClick={handleDateClick}
        currentUser={currentUser}
        users={allUsers}
        filterRole={filterRole}
        dateStatuses={dateStatuses}
        customEvents={customEvents}
      />
      
      {currentUser.isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <section className="p-4 sm:p-6 bg-white shadow-lg rounded-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center">
                        <UsersIcon className="text-blue-600 mr-2"/>
                        <h2 className="text-xl font-semibold text-gray-800">Team Management</h2>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setIsAddUserModalOpen(true)} leftIcon={<UserPlusIcon/>}>
                        Add User
                    </Button>
                </div>
               
                <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {allUsers.map(user => (
                        <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="mb-2 sm:mb-0">
                                <p className="font-medium text-gray-700">{user.name}</p>
                                <div className="flex flex-wrap mt-1">
                                    {user.roles.length > 0 ? 
                                        user.roles.map(role => <RoleBadge key={role} role={role} className="mr-1 mb-1"/>) :
                                        <span className="text-xs text-gray-500 italic">No roles assigned</span>
                                    }
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => openEditRolesModal(user)}>
                                Edit Roles
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="p-4 sm:p-6 bg-white shadow-lg rounded-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center">
                        <ArrowPathRoundedSquareIcon className="text-orange-500 mr-2"/>
                        <h2 className="text-xl font-semibold text-gray-800">Swap Requests</h2>
                        {pendingSwapRequestsCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded-full">
                                {pendingSwapRequestsCount} Pending
                            </span>
                        )}
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {swapRequests.filter(sr => sr.status === SwapRequestStatus.PENDING).length === 0 && (
                         <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">No pending swap requests.</p>
                    )}
                    {swapRequests.filter(sr => sr.status === SwapRequestStatus.PENDING).map(req => (
                        <div key={req.id} className="p-3 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors">
                            <p className="font-medium text-orange-800">{req.requestingUserName}</p>
                            <p className="text-sm text-gray-700">
                                For: {new Date(req.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - <RoleBadge role={req.role}/> {req.serviceType ? `(${SERVICE_TYPE_ABBREVIATIONS[req.serviceType]})` : ''}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 italic">Reason: "{req.reason}"</p>
                            <p className="text-xs text-gray-500 mt-0.5">Requested: {formatSwapRequestTimestamp(req.requestedAt)}</p>
                            <div className="mt-2 flex space-x-2">
                                <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 focus:ring-green-500" onClick={() => handleOpenAdminResolveSwapModal(req)}>
                                  Review & Approve
                                </Button>
                            </div>
                        </div>
                    ))}
                     {swapRequests.filter(sr => sr.status !== SwapRequestStatus.PENDING).length > 0 && (
                        <>
                        <h3 className="text-md font-semibold text-gray-600 mt-4 pt-3 border-t">Resolved Requests</h3>
                        {swapRequests.filter(sr => sr.status !== SwapRequestStatus.PENDING)
                            .sort((a,b) => new Date(b.resolvedAt || 0).getTime() - new Date(a.resolvedAt || 0).getTime()) 
                            .slice(0, 5) 
                            .map(req => (
                            <div key={req.id} className={`p-3 rounded-md opacity-90 ${req.status === SwapRequestStatus.APPROVED ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className="font-medium text-gray-800">{req.requestingUserName}</p>
                                <p className="text-sm text-gray-700">
                                    For: {new Date(req.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - <RoleBadge role={req.role}/>
                                </p>
                                <p className={`text-xs font-semibold ${req.status === SwapRequestStatus.APPROVED ? 'text-green-700' : 'text-red-700'}`}>
                                    Status: {req.status}
                                </p>
                                {req.adminNotes && <p className="text-xs text-gray-600 mt-1">Notes: {req.adminNotes}</p>}
                                <p className="text-xs text-gray-500 mt-0.5">Resolved: {formatSwapRequestTimestamp(req.resolvedAt || '')}</p>
                            </div>
                        ))}
                        </>
                    )}
                </div>
            </section>
        </div>
      )}


      <section className="mt-8 p-4 sm:p-6 bg-white shadow-lg rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center mb-3 sm:mb-0">
              <span className="text-2xl mr-2 text-blue-600" role="img" aria-label="Announcements">📢</span>
              <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
          </div>
          {currentUser.isAdmin && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setIsAddAnnouncementModalOpen(true)}
                leftIcon={<PlusIcon />}
                aria-label="Post New Announcement"
                >
                  Post New
              </Button>
          )}
        </div>
        <AnnouncementBoard announcements={announcements} />
      </section>


      {isAvailabilityModalOpen && selectedDateForModal && (
        <AvailabilityModal
          isOpen={isAvailabilityModalOpen}
          onClose={() => setIsAvailabilityModalOpen(false)}
          selectedDate={selectedDateForModal}
          currentUser={currentUser}
          userAvailabilitiesForDay={getCurrentUserAvailabilitiesForModalDay()}
          allAvailabilitiesForDay={getSelectedDayAvailabilitiesForModal()}
          users={allUsers}
          onUpdateCurrentUserAvailability={handleUpdateCurrentUserAvailability}
          onAdminModifyAvailability={currentUser.isAdmin ? handleAdminModifyAvailability : undefined}
          dateStatus={dateStatuses[selectedDateForModal.toISOString().split('T')[0]]}
          onUpdateDateStatus={currentUser.isAdmin ? onUpdateDateStatus : undefined}
          customEvents={customEvents}
          swapRequests={swapRequests}
          onInitiateSwapRequest={handleOpenSwapRequestModal}
        />
      )}

      {isEditRolesModalOpen && userToEditRoles && (
        <EditUserRolesModal
            isOpen={isEditRolesModalOpen}
            onClose={() => { setIsEditRolesModalOpen(false); setUserToEditRoles(null);}}
            userToEdit={userToEditRoles}
            onSaveRoles={handleSaveUserRoles}
        />
      )}
      {currentUser.isAdmin && isAddUserModalOpen && (
        <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            onSaveUser={handleSaveNewUser}
            existingUsers={allUsers}
        />
      )}
      {currentUser.isAdmin && isAddAnnouncementModalOpen && (
        <AddAnnouncementModal
            isOpen={isAddAnnouncementModalOpen}
            onClose={() => setIsAddAnnouncementModalOpen(false)}
            onPostAnnouncement={handlePostAnnouncement}
        />
      )}
      {currentUser.isAdmin && isEmbedCodeModalOpen && (
        <EmbedCodeModal
            isOpen={isEmbedCodeModalOpen}
            onClose={() => setIsEmbedCodeModalOpen(false)}
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            filterRole={filterRole}
        />
      )}
      {currentUser.isAdmin && isManageCustomEventsModalOpen && (
        <ManageCustomEventsModal
            isOpen={isManageCustomEventsModalOpen}
            onClose={() => setIsManageCustomEventsModalOpen(false)}
            customEvents={customEvents}
            onAddCustomEvent={onAddCustomEvent}
            onDeleteCustomEvent={onDeleteCustomEvent}
            currentDisplayDate={currentDate}
        />
      )}
      {isSwapRequestModalOpen && slotToRequestSwapFor && currentUser && (
        <SwapRequestModal
            isOpen={isSwapRequestModalOpen}
            onClose={() => { setIsSwapRequestModalOpen(false); setSlotToRequestSwapFor(null); }}
            slotDetails={slotToRequestSwapFor}
            requestingUser={currentUser}
            onSubmitRequest={handleSubmitSwapRequest}
        />
      )}
      {currentUser.isAdmin && isAdminResolveSwapModalOpen && swapRequestToResolve && (
        <AdminResolveSwapRequestModal
            isOpen={isAdminResolveSwapModalOpen}
            onClose={() => { setIsAdminResolveSwapModalOpen(false); setSwapRequestToResolve(null); }}
            swapRequest={swapRequestToResolve}
            onResolve={handleAdminResolveSwapRequest}
            allUsers={allUsers} 
        />
      )}

    </div>
  );
};

export default Dashboard;