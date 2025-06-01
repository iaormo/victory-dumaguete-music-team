
import React, { useState, useEffect } from 'react';
import { User, Availability, UserRole, ServiceType } from '../types';
import { ALL_ROLES, SERVICE_TYPES, SERVICE_TYPE_ABBREVIATIONS } from '../constants';
import Modal from './Modal';
import Button from './Button';
import RoleBadge from './RoleBadge';

interface RescheduleSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Availability;
  user: User | undefined;
  onReschedule: (originalSlot: Availability, newDate: string, newRole: UserRole, newServiceType?: ServiceType) => void;
  allUsers: User[]; // Though user is passed, this might be for future consistency or other user-related info.
}

const RescheduleSlotModal: React.FC<RescheduleSlotModalProps> = ({
  isOpen,
  onClose,
  slot,
  user,
  onReschedule,
}) => {
  const [newDate, setNewDate] = useState<string>(slot.date);
  const [newRole, setNewRole] = useState<UserRole>(slot.role);
  const [newServiceType, setNewServiceType] = useState<ServiceType | undefined>(slot.serviceType);
  const [isNewDateSunday, setIsNewDateSunday] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewDate(slot.date);
      setNewRole(slot.role);
      setNewServiceType(slot.serviceType);
      const dateObj = new Date(slot.date + 'T00:00:00'); // Ensure correct parsing for local timezone
      setIsNewDateSunday(dateObj.getDay() === 0);
    }
  }, [isOpen, slot]);

  useEffect(() => {
    if (newDate) {
      const dateObj = new Date(newDate + 'T00:00:00');
      const isSunday = dateObj.getDay() === 0;
      setIsNewDateSunday(isSunday);
      if (!isSunday) {
        setNewServiceType(undefined); // Clear service type if not Sunday
      } else if (isSunday && !newServiceType) {
        setNewServiceType(SERVICE_TYPES[0]); // Default to first service type if now Sunday and was undefined
      }
    }
  }, [newDate, newServiceType]);


  if (!isOpen || !user) return null;

  const originalDateObj = new Date(slot.date + 'T00:00:00');
  const formattedOriginalDate = originalDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });


  const handleConfirmReschedule = () => {
    if (!newDate || !newRole || (isNewDateSunday && !newServiceType)) {
        alert("Please fill in all required fields for the new slot.");
        return;
    }
    onReschedule(slot, newDate, newRole, newServiceType);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reschedule Slot for ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmReschedule}>Confirm Reschedule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Original Slot:</h4>
          <p className="text-sm text-gray-600">
            Date: {formattedOriginalDate} <br />
            Role: <RoleBadge role={slot.role} /> <br />
            {slot.serviceType && `Service: ${SERVICE_TYPE_ABBREVIATIONS[slot.serviceType]}`}
          </p>
        </div>

        <hr/>
        
        <div>
          <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">New Date:</label>
          <input
            type="date"
            id="newDate"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        {isNewDateSunday && (
            <div>
                <label htmlFor="newServiceType" className="block text-sm font-medium text-gray-700">New Service Type (for Sunday):</label>
                <select
                id="newServiceType"
                value={newServiceType || ''}
                onChange={(e) => setNewServiceType(e.target.value as ServiceType)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={isNewDateSunday}
                >
                <option value="" disabled>-- Select Service --</option>
                {SERVICE_TYPES.map(st => (
                    <option key={st} value={st}>{SERVICE_TYPE_ABBREVIATIONS[st]}</option>
                ))}
                </select>
            </div>
        )}

        <div>
          <label htmlFor="newRole" className="block text-sm font-medium text-gray-700">New Role:</label>
          <select
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="" disabled>-- Select Role --</option>
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default RescheduleSlotModal;
