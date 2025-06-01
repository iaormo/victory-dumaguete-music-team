
import React, { useState, useEffect } from 'react';
import { User, Availability, UserRole, ServiceType, DateStatusType, UpdateDateStatusFn, CustomEvent, SwapRequest, SwapRequestStatus } from '../types';
import { ALL_ROLES, ROLE_COLORS, SERVICE_TYPES, SERVICE_TYPE_ABBREVIATIONS, createOriginalAvailabilityId } from '../constants';
import Modal from './Modal';
import Button from './Button';
import RoleBadge from './RoleBadge';
import RescheduleSlotModal from './RescheduleSlotModal'; 

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  currentUser: User | null;
  userAvailabilitiesForDay: Availability[]; 
  allAvailabilitiesForDay: Availability[]; 
  users: User[];
  onUpdateCurrentUserAvailability: (date: string, role: UserRole, serviceType: ServiceType | undefined, isAvailable: boolean) => void;
  onAdminModifyAvailability?: (userId: string, date: string, role: UserRole, serviceType: ServiceType | undefined, isAvailable: boolean) => void;
  dateStatus?: DateStatusType;
  onUpdateDateStatus?: UpdateDateStatusFn;
  customEvents: CustomEvent[];
  swapRequests: SwapRequest[]; // Added for checking pending swaps
  onInitiateSwapRequest: (date: string, role: UserRole, serviceType?: ServiceType) => void; // Added for initiating swap
}

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
);

const ArrowPathRoundedSquareIconMini: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props} className={`w-4 h-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);


const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  currentUser,
  userAvailabilitiesForDay, // These are specific to the currentUser for the selected day
  allAvailabilitiesForDay, // These are for ALL users for the selected day (admin view)
  users,
  onUpdateCurrentUserAvailability,
  onAdminModifyAvailability,
  dateStatus,
  onUpdateDateStatus,
  customEvents,
  swapRequests,
  onInitiateSwapRequest,
}) => {
  const [selfSelectedRoles, setSelfSelectedRoles] = useState<Record<string, UserRole | null>>({});
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('');
  const [adminSelectedRole, setAdminSelectedRole] = useState<UserRole | null>(null);
  const [adminSelectedServiceType, setAdminSelectedServiceType] = useState<ServiceType | undefined>(undefined);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [slotToReschedule, setSlotToReschedule] = useState<Availability | null>(null);

  useEffect(() => {
    if (isOpen && currentUser && selectedDate) {
      const initialSelfRoles: Record<string, UserRole | null> = {};
      const dateStr = selectedDate.toISOString().split('T')[0];
      const isSunday = selectedDate.getDay() === 0;
      const relevantServices = isSunday ? SERVICE_TYPES : [undefined]; 

      relevantServices.forEach(serviceType => {
        const serviceKey = serviceType || 'default';
        // userAvailabilitiesForDay should already be filtered for the current user and day.
        const existingAvailability = userAvailabilitiesForDay.find(av => 
          av.serviceType === serviceType && av.isAvailable
        );
        if (existingAvailability) {
          initialSelfRoles[serviceKey] = existingAvailability.role;
        } else {
            const servableRoles = currentUser.roles.filter(r => r !== UserRole.ADMIN);
            initialSelfRoles[serviceKey] = servableRoles.length > 0 ? null : null; 
        }
      });
      setSelfSelectedRoles(initialSelfRoles);
      
      setAdminSelectedUserId('');
      setAdminSelectedRole(null);
      setAdminSelectedServiceType(isSunday ? SERVICE_TYPES[0] : undefined);
    }
  }, [isOpen, selectedDate, currentUser, userAvailabilitiesForDay]);

  if (!isOpen || !selectedDate || !currentUser) return null;

  const dateString = selectedDate.toISOString().split('T')[0];
  const formattedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dayOfWeek = selectedDate.getDay();
  const isRegularServiceDay = dayOfWeek === 0 || dayOfWeek === 4; // Sunday or Thursday
  const currentCustomEvent = customEvents.find(event => event.date === dateString);
  const isDayOpenForScheduling = isRegularServiceDay || !!currentCustomEvent;
  
  const isDateLocked = dateStatus === DateStatusType.LOCKED;
  const isDateCompleted = dateStatus === DateStatusType.COMPLETED;
  const isDateLockedOrCompleted = isDateLocked || isDateCompleted;

  const canCurrentUserModifyAvailability = (!isDateLockedOrCompleted || currentUser.isAdmin) && isDayOpenForScheduling;
  const canAdminManageDateStatus = currentUser.isAdmin;

  const handleToggleSelfAvailability = (role: UserRole, serviceType: ServiceType | undefined) => {
    onUpdateCurrentUserAvailability(dateString, role, serviceType, !userAvailabilitiesForDay.find(av => av.serviceType === serviceType && av.role === role && av.isAvailable));
  };

  const handleAdminRemoveAvailability = (userId: string, role: UserRole, serviceType: ServiceType | undefined) => {
    if (onAdminModifyAvailability) {
      onAdminModifyAvailability(userId, dateString, role, serviceType, false);
    }
  };
  
  const handleAdminAddAvailability = () => {
    if (adminSelectedUserId && adminSelectedRole && onAdminModifyAvailability) {
      onAdminModifyAvailability(adminSelectedUserId, dateString, adminSelectedRole, adminSelectedServiceType, true);
    }
  };
  
  const openRescheduleModal = (availability: Availability) => {
    setSlotToReschedule(availability);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleConfirmed = (originalSlot: Availability, newDate: string, newRole: UserRole, newServiceType?: ServiceType) => {
    if (onAdminModifyAvailability) {
      onAdminModifyAvailability(originalSlot.userId, originalSlot.date, originalSlot.role, originalSlot.serviceType, false);
      onAdminModifyAvailability(originalSlot.userId, newDate, newRole, newServiceType, true);
    }
    setIsRescheduleModalOpen(false);
    setSlotToReschedule(null);
    if (newDate !== dateString) {
        onClose(); 
    }
  };

  const getUserById = (userId: string) => users.find(u => u.id === userId);
  const availableServableRolesForUser = currentUser.roles.filter(r => r !== UserRole.ADMIN);
  const isSunday = dayOfWeek === 0;
  const servicesToIterate = isSunday ? SERVICE_TYPES : [undefined];

  const renderAdminControls = () => {
    if (!currentUser?.isAdmin) return null;
    return (
      <div className="my-4 p-3 bg-gray-100 rounded-md border border-gray-200">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Admin Controls for this Date</h4>
        
        {canAdminManageDateStatus && onUpdateDateStatus && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-600 mb-1">Date Status:</h5>
            <div className="flex space-x-2 flex-wrap gap-y-2">
              {dateStatus !== DateStatusType.LOCKED && (
                <Button size="sm" variant="secondary" onClick={() => onUpdateDateStatus(dateString, DateStatusType.LOCKED)}>Lock Date</Button>
              )}
              {dateStatus === DateStatusType.LOCKED && (
                <Button size="sm" variant="ghost" className="text-yellow-700 hover:bg-yellow-100" onClick={() => onUpdateDateStatus(dateString, null)}>Unlock Date</Button>
              )}
              {dateStatus !== DateStatusType.COMPLETED && (
                <Button size="sm" variant="secondary" onClick={() => onUpdateDateStatus(dateString, DateStatusType.COMPLETED)}>Mark Completed</Button>
              )}
              {dateStatus === DateStatusType.COMPLETED && (
                <Button size="sm" variant="ghost" className="text-green-700 hover:bg-green-100" onClick={() => onUpdateDateStatus(dateString, null)}>Unmark Completed</Button>
              )}
            </div>
            {dateStatus && <p className="text-xs text-gray-500 mt-1">Current status: {dateStatus}</p>}
          </div>
        )}

        {currentCustomEvent && (
          <div className="pt-3 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <CalendarIcon className="mr-1.5 text-blue-600"/> Custom Event:
            </h5>
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700"><strong>Event:</strong> {currentCustomEvent.title}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentUser.isAdmin ? 'Manage' : 'Set'} Availability: ${formattedDate} ${dateStatus ? `(${dateStatus})` : ''}`}
      footer={ <Button variant="secondary" onClick={onClose}>Close</Button> }
    >
      {currentUser.isAdmin && renderAdminControls()}

      {!isDayOpenForScheduling && currentUser.isAdmin && (
        <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-md mb-4 border border-orange-200">
          This day is not a regular service day and has no custom event. To enable scheduling, add an event via the "Manage Events" button on the dashboard.
        </p>
      )}
       {!isDayOpenForScheduling && !currentUser.isAdmin && (
        <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md mb-4 border border-red-200">
          This day is not open for scheduling.
        </p>
      )}

      {isDateLockedOrCompleted && !currentUser.isAdmin && isDayOpenForScheduling && (
        <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md mb-4 border border-red-200">
          This date is currently {dateStatus?.toLowerCase()}. Availability cannot be changed. Consider requesting a swap if scheduled.
        </p>
      )}

      {isDayOpenForScheduling && servicesToIterate.map(serviceType => {
        const serviceKey = serviceType || 'default';
        const serviceName = serviceType ? SERVICE_TYPE_ABBREVIATIONS[serviceType] : "General";
        
        const currentSelfAvailabilityForService = userAvailabilitiesForDay.find(av => 
            av.serviceType === serviceType && av.userId === currentUser.id && av.isAvailable
        );
        
        // Swap Request Logic for this specific slot
        let hasPendingSwapRequest = false;
        if (currentSelfAvailabilityForService) {
            const originalAvId = createOriginalAvailabilityId(currentUser.id, dateString, currentSelfAvailabilityForService.role, serviceType);
            hasPendingSwapRequest = swapRequests.some(sr => 
                sr.originalAvailabilityId === originalAvId && 
                sr.requestingUserId === currentUser.id &&
                sr.status === SwapRequestStatus.PENDING
            );
        }
        const canRequestSwap = isDateLocked && !isDateCompleted && currentSelfAvailabilityForService && !currentUser.isAdmin;

        return (
            <div key={serviceKey} className={`p-3 rounded-md mb-3 ${isSunday ? 'bg-slate-100 border border-slate-200' : ''}`}>
                {isSunday && <h4 className="text-md font-semibold text-blue-700 mb-2">{serviceName}</h4>}
                
                {availableServableRolesForUser.length === 0 && (
                     <p className="text-sm text-red-700 bg-red-100 p-2 rounded-md">You have no servable roles assigned.</p>
                )}
                {availableServableRolesForUser.length > 0 && (
                    <div className="mb-2">
                        <label htmlFor={`roleSelect-${serviceKey}`} className="block text-sm font-medium text-gray-700 mb-1">
                            {isSunday ? "Your Role for this Service:" : "Your Role:"}
                        </label>
                        <select
                            id={`roleSelect-${serviceKey}`}
                            value={selfSelectedRoles[serviceKey] || ''}
                            onChange={(e) => {
                                const role = e.target.value as UserRole;
                                setSelfSelectedRoles(prev => ({...prev, [serviceKey]: role }));
                                if (role) {
                                     onUpdateCurrentUserAvailability(dateString, role, serviceType, true);
                                } else if (currentSelfAvailabilityForService) { // If they de-select to "Not Available"
                                    onUpdateCurrentUserAvailability(dateString, currentSelfAvailabilityForService.role, serviceType, false);
                                }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={!canCurrentUserModifyAvailability || availableServableRolesForUser.length === 0}
                        >
                            <option value="">-- Not Available / Select Role --</option>
                            {availableServableRolesForUser.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                )}
                 {currentSelfAvailabilityForService && (
                    <div className="text-sm mt-1 flex items-center justify-between">
                        <span>
                            You are marked as: <RoleBadge role={currentSelfAvailabilityForService.role} />
                            {isDateLockedOrCompleted && !currentUser.isAdmin && <span className="text-xs text-red-600 ml-1">(Locked)</span>}
                        </span>
                        {canRequestSwap && (
                             <Button
                                size="sm"
                                variant={hasPendingSwapRequest ? "ghost" : "primary"}
                                className={`${hasPendingSwapRequest ? 'text-orange-600 bg-orange-100 hover:bg-orange-200 border-orange-300' : 'bg-orange-500 hover:bg-orange-600'} px-2 py-1 text-xs`}
                                onClick={() => onInitiateSwapRequest(dateString, currentSelfAvailabilityForService.role, serviceType)}
                                disabled={hasPendingSwapRequest}
                                leftIcon={<ArrowPathRoundedSquareIconMini/>}
                            >
                                {hasPendingSwapRequest ? "Swap Pending" : "Request Swap"}
                            </Button>
                        )}
                    </div>
                )}
                {!canCurrentUserModifyAvailability && availableServableRolesForUser.length > 0 && !currentSelfAvailabilityForService && (
                     <p className="text-xs text-gray-500 mt-1">Availability changes locked for this day.</p>
                )}
            </div>
        );
      })}


      {currentUser.isAdmin && isDayOpenForScheduling && (
        <div className="space-y-6 mt-6 pt-4 border-t border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Team Availability on this Date:</h3>
            {allAvailabilitiesForDay.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-100 custom-scrollbar">
                {allAvailabilitiesForDay.map(av => {
                  const user = getUserById(av.userId);
                  if (!user) return null;
                  return (
                    <li key={`${av.userId}-${av.role}-${av.serviceType || 'default'}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-white rounded-md shadow-sm gap-2 border border-gray-200">
                      <div>
                        <span className="text-sm text-gray-800 block font-medium">{user.name}</span>
                        <RoleBadge role={av.role} />
                        {av.serviceType && <span className="ml-1 text-xs text-blue-600">({SERVICE_TYPE_ABBREVIATIONS[av.serviceType]})</span>}
                      </div>
                      {onAdminModifyAvailability && (!isDateLockedOrCompleted || currentUser.isAdmin) && (
                        <div className="flex space-x-1 mt-1 sm:mt-0 flex-wrap">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openRescheduleModal(av)}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                            >
                            Reschedule
                            </Button>
                            <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleAdminRemoveAvailability(av.userId, av.role, av.serviceType)}
                            className="px-2 py-1 text-xs"
                            >
                            Remove
                            </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 p-2 bg-gray-100 rounded-md">No team members are currently marked available on this date (based on current filters).</p>
            )}
          </div>

          {onAdminModifyAvailability && (!isDateLockedOrCompleted || currentUser.isAdmin) && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-700 mb-2">Add / Set Team Availability:</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="adminUserSelect" className="block text-sm font-medium text-gray-700">Select User:</label>
                  <select
                    id="adminUserSelect"
                    value={adminSelectedUserId}
                    onChange={e => setAdminSelectedUserId(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>-- Select User --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {isSunday && (
                     <div>
                        <label htmlFor="adminServiceTypeSelect" className="block text-sm font-medium text-gray-700">Select Service:</label>
                        <select
                            id="adminServiceTypeSelect"
                            value={adminSelectedServiceType || ''}
                            onChange={e => setAdminSelectedServiceType(e.target.value as ServiceType)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={!adminSelectedUserId}
                        >
                           {SERVICE_TYPES.map(st => <option key={st} value={st}>{SERVICE_TYPE_ABBREVIATIONS[st]}</option>)}
                        </select>
                    </div>
                )}
                <div>
                  <label htmlFor="adminRoleSelect" className="block text-sm font-medium text-gray-700">Select Role:</label>
                  <select
                    id="adminRoleSelect"
                    value={adminSelectedRole || ''}
                    onChange={e => setAdminSelectedRole(e.target.value as UserRole)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={!adminSelectedUserId}
                  >
                    <option value="" disabled>-- Select Role --</option>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <Button
                  onClick={handleAdminAddAvailability}
                  disabled={!adminSelectedUserId || !adminSelectedRole || (isSunday && !adminSelectedServiceType)}
                  variant="primary"
                >
                  Mark Selected User Available
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>

    {currentUser?.isAdmin && slotToReschedule && (
        <RescheduleSlotModal
            isOpen={isRescheduleModalOpen}
            onClose={() => { setIsRescheduleModalOpen(false); setSlotToReschedule(null); }}
            slot={slotToReschedule}
            user={getUserById(slotToReschedule.userId)}
            onReschedule={handleRescheduleConfirmed}
            allUsers={users}
        />
    )}
    </>
  );
};

export default AvailabilityModal;