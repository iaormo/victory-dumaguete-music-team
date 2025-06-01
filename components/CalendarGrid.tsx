
import React from 'react';
import { User, Availability, UserRole, ServiceType, DateStatusType, CustomEvent } from '../types';
import { DAYS_OF_WEEK, MONTH_NAMES, ROLE_COLORS, SERVICE_TYPE_ABBREVIATIONS, DATE_STATUS_STYLES } from '../constants';
import RoleBadge from './RoleBadge';

interface CalendarGridProps {
  currentDate: Date;
  availabilities: Availability[];
  onDateClick?: (date: Date, dayAvailabilities: Availability[]) => void;
  currentUser: User | null;
  users: User[];
  filterRole: UserRole | null;
  dateStatuses: Record<string, DateStatusType | undefined>;
  customEvents: CustomEvent[];
  isReadOnly?: boolean;
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  titleAccess: string; 
}

const LockIcon: React.FC<IconProps> = ({ titleAccess, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <title>{titleAccess}</title>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
  </svg>
);

const CheckIcon: React.FC<IconProps> = ({ titleAccess, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <title>{titleAccess}</title>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  currentDate, 
  availabilities, 
  onDateClick, 
  currentUser, 
  users, 
  filterRole, 
  dateStatuses, 
  customEvents,
  isReadOnly = false 
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const getDayAvailabilities = (date: Date): Availability[] => {
    const dateString = date.toISOString().split('T')[0];
    return availabilities.filter(av => 
        av.date === dateString && 
        av.isAvailable && 
        (filterRole ? av.role === filterRole : true)
    );
  };
  
  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const renderDayCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="border border-gray-300 p-1 min-h-[7rem] sm:min-h-[8rem] md:min-h-[9rem] bg-gray-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cellDateString = cellDate.toISOString().split('T')[0];
      const isToday = cellDate.getTime() === today.getTime();
      const dayOfWeek = cellDate.getDay(); // 0 for Sunday, 4 for Thursday
      
      const status = dateStatuses[cellDateString];
      const statusStyle = status ? DATE_STATUS_STYLES[status] : null;

      const userAvailabilitiesForDay = !isReadOnly && currentUser ? availabilities.filter(a => 
        a.userId === currentUser.id && 
        a.date === cellDateString && 
        a.isAvailable
      ) : [];
      
      const customEventOnDay = customEvents.find(event => event.date === cellDateString);
      const isServiceDay = dayOfWeek === 0 || dayOfWeek === 4; // Sunday or Thursday
      const isHighlightedDay = isServiceDay || !!customEventOnDay;

      let canBeClicked = false;
      if (isReadOnly) {
          canBeClicked = false;
      } else if (currentUser?.isAdmin) {
          canBeClicked = true; // Admins can click any day
      } else {
          canBeClicked = isHighlightedDay; // Non-admins can only click highlighted days
      }
      
      let cellBgClass = 'bg-white'; // Default for non-highlighted days if not 'today'
      if (isHighlightedDay) {
        cellBgClass = isToday ? 'bg-gradient-to-br from-blue-200 to-blue-300' : 'bg-gradient-to-br from-blue-50 to-blue-100';
      } else {
        cellBgClass = isToday ? 'bg-blue-100' : 'bg-gray-50'; // Muted for non-highlighted days
      }
      if (status) { // If a status is set, it might override or blend
         cellBgClass = isToday ? 'bg-blue-100 opacity-90' : (isHighlightedDay ? 'bg-gradient-to-br from-blue-50 to-blue-100 opacity-80' : 'bg-gray-100 opacity-90');
      }


      const effectiveAdminView = (currentUser?.isAdmin || isReadOnly);
      const dayAvailabilities = getDayAvailabilities(cellDate);

      cells.push(
        <div
          key={day}
          className={`border p-2 min-h-[7rem] sm:min-h-[8rem] md:min-h-[9rem] flex flex-col transition-colors duration-150 relative
            ${cellBgClass}
            ${statusStyle ? `${statusStyle.borderColor} border-2` : 'border-gray-300'}
            ${canBeClicked && onDateClick ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}
            ${!isHighlightedDay && !currentUser?.isAdmin && !isReadOnly ? 'opacity-60' : ''}
          `}
          onClick={canBeClicked && onDateClick ? () => onDateClick(cellDate, dayAvailabilities) : undefined}
          aria-label={`Date ${day} ${MONTH_NAMES[month]} ${year}, Status: ${status || 'Normal'}${isHighlightedDay ? ', Service/Event Day' : ''}${isReadOnly ? ', Read-only' : ''}`}
        >
          <div className={`flex justify-between items-center mb-1 
            ${isToday && isHighlightedDay ? 'font-bold text-blue-700' : 
              (isToday ? 'font-bold text-blue-600' : 
                (isHighlightedDay ? 'text-gray-900 font-medium' : 'text-gray-500'))} 
            ${statusStyle ? statusStyle.textColor : ''}`}>
            <span>{day}</span>
            <div className="flex items-center space-x-1">
                {status === DateStatusType.LOCKED && <LockIcon className="w-3 h-3 text-yellow-600" titleAccess="Date Locked"/>}
                {status === DateStatusType.COMPLETED && <CheckIcon className="w-4 h-4 text-green-600" titleAccess="Date Completed"/>}
                {!currentUser?.isAdmin && !isReadOnly && userAvailabilitiesForDay.length > 0 && isHighlightedDay && (
                   <span className="text-xs px-1.5 py-0.5 bg-green-500 text-white rounded-full shadow-sm" aria-label="You are available this day">You</span>
                )}
            </div>
          </div>

          {customEventOnDay && (
            <p className="text-xs font-semibold text-blue-700 truncate mb-0.5" title={customEventOnDay.title}>
              {customEventOnDay.title}
            </p>
          )}

          <div className="text-xs space-y-0.5 overflow-y-auto flex-grow custom-scrollbar">
            {isHighlightedDay && effectiveAdminView && dayAvailabilities.map(av => {
              const user = getUserById(av.userId);
              const serviceAbbr = av.serviceType ? ` (${SERVICE_TYPE_ABBREVIATIONS[av.serviceType].substring(0,3)})` : '';
              return (
                <div key={`${av.userId}-${av.role}-${av.serviceType || 'default'}`} 
                     className={`p-0.5 rounded-sm text-white text-[10px] truncate ${ROLE_COLORS[av.role] || 'bg-gray-400'}`}>
                  {user?.originalNameHint.split(' ')[0]} ({av.role.substring(0,3)}{serviceAbbr})
                </div>
              );
            })}

            {isHighlightedDay && !effectiveAdminView && userAvailabilitiesForDay.map(av => (
              <div key={`${av.userId}-${av.role}-${av.serviceType || 'default'}`}
                   className={`p-1 rounded-sm text-white text-[10px] ${ROLE_COLORS[av.role] || 'bg-gray-400'}`}>
                Available as {av.role} {av.serviceType ? `(${SERVICE_TYPE_ABBREVIATIONS[av.serviceType]})` : ''}
              </div>
            ))}
            
            {isHighlightedDay && effectiveAdminView && dayAvailabilities.length === 0 && <span className="text-gray-500 text-[10px]">{isReadOnly ? "No scheduled members" : "No one available"}</span>}
            
            {isHighlightedDay && !effectiveAdminView && userAvailabilitiesForDay.length === 0 && <span className="text-gray-500 text-[10px]">Click to set</span>}

            {!isHighlightedDay && (
                <span className="text-gray-400 text-[10px] italic">
                  {isReadOnly ? "Not a scheduled day" : 
                    (currentUser?.isAdmin ? "Use 'Manage Events' to add" : "Not a service/event day")}
                </span>
            )}
          </div>
          {dayOfWeek === 0 && <div className="absolute bottom-1 right-1 text-[9px] text-blue-600 font-semibold">SUNDAY</div>}
          {dayOfWeek === 4 && !customEventOnDay && <div className="absolute bottom-1 right-1 text-[9px] text-sky-700 font-semibold">THURSDAY</div>}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-7 gap-px text-center font-medium text-gray-700 mb-2">
        {DAYS_OF_WEEK.map(dayOfWeek => <div key={dayOfWeek}>{dayOfWeek}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {renderDayCells()}
      </div>
    </div>
  );
};

export default CalendarGrid;