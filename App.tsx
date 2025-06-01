import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, Availability, ServiceType, DateStatusType, Announcement, CustomEvent, SwapRequest, SwapRequestStatus } from './types';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import EmbeddableCalendarPage from './components/EmbeddableCalendarPage'; // New import
import {
  MOCK_USERS,
  ALL_USERS_LOCAL_STORAGE_KEY,
  CURRENT_USER_LOCAL_STORAGE_KEY,
  AVAILABILITIES_LOCAL_STORAGE_KEY,
  DATE_STATUS_LOCAL_STORAGE_KEY,
  ANNOUNCEMENTS_LOCAL_STORAGE_KEY,
  MOCK_ANNOUNCEMENTS,
  CUSTOM_EVENTS_LOCAL_STORAGE_KEY,
  MOCK_CUSTOM_EVENTS,
  SWAP_REQUESTS_LOCAL_STORAGE_KEY,
  MOCK_SWAP_REQUESTS,
  parseOriginalAvailabilityId,
  generateUserDisplayName
} from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem(ALL_USERS_LOCAL_STORAGE_KEY);
    try {
      const parsed = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
      return parsed.map((u: User) => ({...u, name: generateUserDisplayName(u.originalNameHint, u.roles, u.isAdmin)}));
    } catch (error) {
      console.error("Failed to parse stored users:", error);
      return MOCK_USERS.map(u => ({...u, name: generateUserDisplayName(u.originalNameHint, u.roles, u.isAdmin)}));
    }
  });
  const [loading, setLoading] = useState(true);

  const [availabilities, setAvailabilities] = useState<Availability[]>(() => {
    const storedAvailabilities = localStorage.getItem(AVAILABILITIES_LOCAL_STORAGE_KEY);
    try {
      return storedAvailabilities ? JSON.parse(storedAvailabilities) : [];
    } catch (error) {
      console.error("Failed to parse availabilities from localStorage:", error);
      return [];
    }
  });

  const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatusType | undefined>>(() => {
    const storedStatuses = localStorage.getItem(DATE_STATUS_LOCAL_STORAGE_KEY);
    try {
      return storedStatuses ? JSON.parse(storedStatuses) : {};
    } catch (error) {
      console.error("Failed to parse date statuses:", error);
      return {};
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const storedAnnouncements = localStorage.getItem(ANNOUNCEMENTS_LOCAL_STORAGE_KEY);
    try {
      return storedAnnouncements ? JSON.parse(storedAnnouncements) : MOCK_ANNOUNCEMENTS;
    } catch (error) {
      console.error("Failed to parse announcements from localStorage:", error);
      return MOCK_ANNOUNCEMENTS;
    }
  });

  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
    const storedCustomEvents = localStorage.getItem(CUSTOM_EVENTS_LOCAL_STORAGE_KEY);
    try {
        return storedCustomEvents ? JSON.parse(storedCustomEvents) : MOCK_CUSTOM_EVENTS;
    } catch (error) {
        console.error("Failed to parse custom events:", error);
        return MOCK_CUSTOM_EVENTS;
    }
  });

  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(() => {
    const storedSwapRequests = localStorage.getItem(SWAP_REQUESTS_LOCAL_STORAGE_KEY);
    try {
        return storedSwapRequests ? JSON.parse(storedSwapRequests) : MOCK_SWAP_REQUESTS;
    } catch (error) {
        console.error("Failed to parse swap requests:", error);
        return MOCK_SWAP_REQUESTS;
    }
  });


  useEffect(() => {
    localStorage.setItem(ALL_USERS_LOCAL_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(AVAILABILITIES_LOCAL_STORAGE_KEY, JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem(DATE_STATUS_LOCAL_STORAGE_KEY, JSON.stringify(dateStatuses));
  }, [dateStatuses]);

  useEffect(() => {
    localStorage.setItem(ANNOUNCEMENTS_LOCAL_STORAGE_KEY, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_EVENTS_LOCAL_STORAGE_KEY, JSON.stringify(customEvents));
  }, [customEvents]);

  useEffect(() => {
    localStorage.setItem(SWAP_REQUESTS_LOCAL_STORAGE_KEY, JSON.stringify(swapRequests));
  }, [swapRequests]);


  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_LOCAL_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        const liveUserRecord = allUsers.find(u => u.id === parsedUser.id);
        if (liveUserRecord) {
          setCurrentUser(liveUserRecord);
        } else {
          localStorage.removeItem(CURRENT_USER_LOCAL_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to parse stored current user:", error);
        localStorage.removeItem(CURRENT_USER_LOCAL_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, [allUsers]); 

  const handleLogin = useCallback((user: User) => {
    const liveUserRecord = allUsers.find(u => u.id === user.id);
    if (liveUserRecord) {
      setCurrentUser(liveUserRecord);
      localStorage.setItem(CURRENT_USER_LOCAL_STORAGE_KEY, JSON.stringify(liveUserRecord));
    } else {
      const userWithFormattedName = {...user, name: generateUserDisplayName(user.originalNameHint, user.roles, user.isAdmin)};
      setCurrentUser(userWithFormattedName);
      localStorage.setItem(CURRENT_USER_LOCAL_STORAGE_KEY, JSON.stringify(userWithFormattedName));
      setAllUsers(prev => {
          const userExists = prev.some(u => u.id === user.id);
          return userExists ? prev.map(u => u.id === user.id ? userWithFormattedName : u) : [...prev, userWithFormattedName];
      });
    }
  }, [allUsers]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_LOCAL_STORAGE_KEY);
  };

  const handleUpdateUserRoles = useCallback((userId: string, newRoles: UserRole[]) => {
    setAllUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u =>
        u.id === userId
          ? { ...u, roles: newRoles, isAdmin: newRoles.includes(UserRole.ADMIN), name: generateUserDisplayName(u.originalNameHint, newRoles, newRoles.includes(UserRole.ADMIN)) }
          : u
      );
      if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
        if (updatedCurrentUser) {
          setCurrentUser(updatedCurrentUser);
          localStorage.setItem(CURRENT_USER_LOCAL_STORAGE_KEY, JSON.stringify(updatedCurrentUser));
        }
      }
      return updatedUsers;
    });
  }, [currentUser]);

  const handleUpdateAvailability = useCallback((
    userIdToUpdate: string,
    dateString: string,
    role: UserRole,
    serviceType: ServiceType | undefined,
    isNowAvailable: boolean
  ) => {
    setAvailabilities(prevAvailabilities => {
      let updatedAvailabilities = [...prevAvailabilities];
      // Remove any existing availability for this specific slot before adding/not adding
      updatedAvailabilities = updatedAvailabilities.filter(
        av => !(
          av.userId === userIdToUpdate &&
          av.date === dateString &&
          av.serviceType === serviceType && // Must match service type
          av.role === role // Must match role for removal, but when adding a user, this specific user might not have this role in their current availabilities
        )
      );

      // More robust removal: remove any availability for this user on this date/serviceType combination,
      // as a user can only have one role per service slot.
       updatedAvailabilities = updatedAvailabilities.filter(
        av => !(
          av.userId === userIdToUpdate &&
          av.date === dateString &&
          av.serviceType === serviceType
        )
      );


      if (isNowAvailable) {
        updatedAvailabilities.push({
          userId: userIdToUpdate,
          date: dateString,
          role,
          serviceType,
          isAvailable: true
        });
      }
      return updatedAvailabilities;
    });
  }, [setAvailabilities]);

  const handleUpdateDateStatus = useCallback((date: string, status: DateStatusType | null) => {
    setDateStatuses(prev => {
      const newStatuses = { ...prev };
      if (status === null) {
        delete newStatuses[date];
      } else {
        newStatuses[date] = status;
      }
      return newStatuses;
    });
  }, []);

  const handleAddNewUser = useCallback((originalNameHint: string, email: string, roles: UserRole[]): User | null => {
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Error: Email already exists.');
      return null;
    }
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalNameHint,
      email,
      roles,
      isAdmin: roles.includes(UserRole.ADMIN),
      name: generateUserDisplayName(originalNameHint, roles, roles.includes(UserRole.ADMIN))
    };
    setAllUsers(prev => [...prev, newUser]);
    return newUser;
  }, [allUsers]);

  const handleAddAnnouncement = useCallback((content: string) => {
    if (!currentUser || !currentUser.isAdmin) return; 
    const newAnnouncement: Announcement = {
      id: `anno-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content,
      timestamp: new Date().toISOString(),
      authorName: currentUser.name,
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]); 
  }, [currentUser]);

  const handleAddCustomEvent = useCallback((date: string, title: string): CustomEvent | null => {
    if (!currentUser || !currentUser.isAdmin) return null;
    if (!title.trim()) {
        alert("Event title cannot be empty.");
        return null;
    }
    const existingEvent = customEvents.find(e => e.date === date);
    if (existingEvent) {
        alert(`An event '${existingEvent.title}' already exists on this date. You can remove it first if you want to add a new one.`);
        return null;
    }

    const newCustomEvent: CustomEvent = {
        id: `customevent-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        date,
        title: title.trim(),
    };
    setCustomEvents(prev => [...prev, newCustomEvent].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return newCustomEvent;
  }, [currentUser, customEvents]);

  const handleDeleteCustomEvent = useCallback((eventId: string) => {
    if (!currentUser || !currentUser.isAdmin) return;
    setCustomEvents(prev => prev.filter(event => event.id !== eventId));
  }, [currentUser]);

  const handleAddSwapRequest = useCallback((
    requestingUserId: string,
    requestingUserName: string,
    date: string,
    role: UserRole,
    serviceType: ServiceType | undefined,
    reason: string,
    originalAvailabilityId: string
  ): SwapRequest | null => {
    if (!currentUser || currentUser.id !== requestingUserId) {
      console.error("User mismatch or not logged in for swap request");
      return null;
    }
    const existingPendingRequest = swapRequests.find(sr => 
        sr.originalAvailabilityId === originalAvailabilityId && 
        sr.requestingUserId === requestingUserId &&
        sr.status === SwapRequestStatus.PENDING
    );
    if (existingPendingRequest) {
        alert("You already have a pending swap request for this slot.");
        return null;
    }

    const newSwapRequest: SwapRequest = {
      id: `swap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestingUserId,
      requestingUserName,
      date,
      role,
      serviceType,
      reason: reason.trim(),
      status: SwapRequestStatus.PENDING,
      requestedAt: new Date().toISOString(),
      originalAvailabilityId,
    };
    setSwapRequests(prev => [newSwapRequest, ...prev].sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    return newSwapRequest;
  }, [currentUser, swapRequests]);

  const handleUpdateSwapRequestStatus = useCallback((
    swapRequestId: string,
    newStatus: SwapRequestStatus.APPROVED, // Only approved status from modal now
    adminNotes?: string,
    replacementUserId?: string | null
  ) => {
    if (!currentUser || !currentUser.isAdmin) return;

    setSwapRequests(prevRequests => {
      const updatedRequests = prevRequests.map(req => {
        if (req.id === swapRequestId) {
          const updatedReq = {
            ...req,
            status: newStatus, // Should always be APPROVED here
            adminNotes: adminNotes?.trim() || req.adminNotes,
            resolvedAt: new Date().toISOString(),
            resolvedByAdminId: currentUser.id,
          };

          // This logic assumes newStatus is always APPROVED
          const slotDetails = parseOriginalAvailabilityId(req.originalAvailabilityId);
          if (slotDetails) {
            // Remove the original user's availability
            handleUpdateAvailability(slotDetails.userId, slotDetails.date, slotDetails.role, slotDetails.serviceType, false);

            // If a replacement is chosen, add their availability
            if (replacementUserId) {
              const replacementUser = allUsers.find(u => u.id === replacementUserId);
              if (replacementUser && replacementUser.roles.includes(slotDetails.role)) {
                handleUpdateAvailability(replacementUserId, slotDetails.date, slotDetails.role, slotDetails.serviceType, true);
              } else {
                console.warn("Selected replacement user not found or does not have the required role for the slot:", slotDetails.role);
                alert("Warning: Selected replacement user could not be assigned. The slot remains open. Please check the user's roles.");
              }
            }
          } else {
            console.error("Could not parse originalAvailabilityId for approved swap request:", req.originalAvailabilityId);
            alert("Error processing swap approval. Could not identify original slot details.");
          }
          return updatedReq;
        }
        return req;
      });
      return updatedRequests.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    });
  }, [currentUser, handleUpdateAvailability, allUsers]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Loading application...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={handleLogin} allUsers={allUsers} />
            )
          }
        />
        <Route
          path="/embed/calendar/:year/:month"
          element={<EmbeddableCalendarPage />}
        />
        <Route
          path="/"
          element={
            currentUser ? (
              <Dashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                allUsers={allUsers}
                availabilities={availabilities}
                onUpdateUserRoles={handleUpdateUserRoles}
                onUpdateAvailability={handleUpdateAvailability}
                dateStatuses={dateStatuses}
                onUpdateDateStatus={handleUpdateDateStatus}
                onAddNewUser={handleAddNewUser}
                announcements={announcements}
                onAddAnnouncement={handleAddAnnouncement}
                customEvents={customEvents}
                onAddCustomEvent={handleAddCustomEvent}
                onDeleteCustomEvent={handleDeleteCustomEvent}
                swapRequests={swapRequests}
                onAddSwapRequest={handleAddSwapRequest}
                onUpdateSwapRequestStatus={handleUpdateSwapRequestStatus}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;