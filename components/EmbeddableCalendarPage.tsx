
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import { User, Availability, UserRole, DateStatusType, CustomEvent } from '../types'; // Added CustomEvent
import { 
    ALL_USERS_LOCAL_STORAGE_KEY, 
    AVAILABILITIES_LOCAL_STORAGE_KEY, 
    DATE_STATUS_LOCAL_STORAGE_KEY,
    CUSTOM_EVENTS_LOCAL_STORAGE_KEY, // Added custom events key
    MOCK_CUSTOM_EVENTS, // Added mock custom events
    MONTH_NAMES,
    generateUserDisplayName,
    MOCK_USERS 
} from '../constants';

const EmbeddableCalendarPage: React.FC = () => {
  const { year: yearParam, month: monthParam } = useParams<{ year: string; month: string }>();
  const location = useLocation();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatusType | undefined>>({});
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]); // Added customEvents state
  const [filterRole, setFilterRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const year = parseInt(yearParam || '', 10);
      const month = parseInt(monthParam || '', 10); // month is 0-indexed in JavaScript Date

      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        setError('Invalid year or month provided in URL.');
        setLoading(false);
        return;
      }
      setCurrentDate(new Date(year, month, 1));

      const queryParams = new URLSearchParams(location.search);
      const roleFromQuery = queryParams.get('filterRole') as UserRole | null;
      setFilterRole(roleFromQuery);

      const storedUsers = localStorage.getItem(ALL_USERS_LOCAL_STORAGE_KEY);
      const parsedUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS.map(u => ({...u, name: generateUserDisplayName(u.originalNameHint, u.roles, u.isAdmin)}));
      setAllUsers(parsedUsers.map((u:User) => ({...u, name: generateUserDisplayName(u.originalNameHint, u.roles, u.isAdmin)})));
      
      const storedAvailabilities = localStorage.getItem(AVAILABILITIES_LOCAL_STORAGE_KEY);
      setAvailabilities(storedAvailabilities ? JSON.parse(storedAvailabilities) : []);

      const storedDateStatuses = localStorage.getItem(DATE_STATUS_LOCAL_STORAGE_KEY);
      setDateStatuses(storedDateStatuses ? JSON.parse(storedDateStatuses) : {});

      const storedCustomEvents = localStorage.getItem(CUSTOM_EVENTS_LOCAL_STORAGE_KEY); // Load custom events
      setCustomEvents(storedCustomEvents ? JSON.parse(storedCustomEvents) : MOCK_CUSTOM_EVENTS); // Set custom events

      setLoading(false);
    } catch (e) {
      console.error("Error loading data for embeddable calendar:", e);
      setError('Failed to load calendar data. Please ensure the main application has been set up.');
      setLoading(false);
    }
  }, [yearParam, monthParam, location.search]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading calendar...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  if (!currentDate) {
    return <div className="p-4 text-center text-gray-600">Could not determine date.</div>;
  }

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold text-indigo-700 text-center mb-4">
        Schedule for {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        {filterRole && <span className="text-lg block sm:inline sm:ml-2 text-gray-600">({filterRole})</span>}
      </h1>
      <CalendarGrid
        currentDate={currentDate}
        availabilities={availabilities}
        currentUser={null} // No logged-in user context for embed
        users={allUsers}
        filterRole={filterRole}
        dateStatuses={dateStatuses}
        customEvents={customEvents} // Pass customEvents to CalendarGrid
        isReadOnly={true} // Crucial for embed
        // onDateClick is omitted as it's read-only
      />
       <footer className="text-center mt-4 text-xs text-gray-500">
        Powered by Victory Dumaguete Music Team Scheduler
      </footer>
    </div>
  );
};

export default EmbeddableCalendarPage;
