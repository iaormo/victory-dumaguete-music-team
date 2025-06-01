
import React, { useState, useEffect, useMemo } from 'react';
import { CustomEvent } from '../types';
import Modal from './Modal';
import Button from './Button';
import { MONTH_NAMES } from '../constants';

interface ManageCustomEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customEvents: CustomEvent[];
  onAddCustomEvent: (date: string, title: string) => CustomEvent | null;
  onDeleteCustomEvent: (eventId: string) => void;
  currentDisplayDate: Date; // To filter events for the current month view
}

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-4 h-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.492 3.004 1.318S5.03 8.55 5.03 9.5V11a2.25 2.25 0 002.25 2.25h9.5A2.25 2.25 0 0019 11V9.5c0-.95-.53-1.837-1.318-2.482A5.485 5.485 0 0014.74 5.79" />
  </svg>
);

const ManageCustomEventsModal: React.FC<ManageCustomEventsModalProps> = ({
  isOpen,
  onClose,
  customEvents,
  onAddCustomEvent,
  onDeleteCustomEvent,
  currentDisplayDate,
}) => {
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default date to the first day of the currently viewed month
      const year = currentDisplayDate.getFullYear();
      const month = (currentDisplayDate.getMonth() + 1).toString().padStart(2, '0');
      setNewEventDate(`${year}-${month}-01`);
      setNewEventTitle('');
      setError('');
    }
  }, [isOpen, currentDisplayDate]);

  const handleAddEvent = () => {
    if (!newEventDate || !newEventTitle.trim()) {
      setError('Both date and title are required for a custom event.');
      return;
    }
    const success = onAddCustomEvent(newEventDate, newEventTitle.trim());
    if (success) {
      setNewEventTitle(''); // Keep date for potentially adding more in same month
      setError('');
    } else {
      // onAddCustomEvent handles alerts for duplicates or empty titles
      // setError might be set if other validation occurs here in future
    }
  };
  
  const handleDeleteEvent = (eventId: string) => {
      if (window.confirm("Are you sure you want to delete this custom event?")) {
          onDeleteCustomEvent(eventId);
      }
  };

  const eventsForCurrentMonth = useMemo(() => {
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth(); // 0-indexed
    return customEvents
      .filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00'); // ensure local timezone interpretation
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      })
      .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate()); // Sort by day of month
  }, [customEvents, currentDisplayDate]);

  const modalTitle = `Manage Custom Events for ${MONTH_NAMES[currentDisplayDate.getMonth()]} ${currentDisplayDate.getFullYear()}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6">
        {/* Add New Event Form */}
        <div className="p-4 border border-gray-200 rounded-lg bg-slate-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Custom Event</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="newEventDate" className="block text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                id="newEventDate"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newEventTitle" className="block text-sm font-medium text-gray-700">Title:</label>
              <input
                type="text"
                id="newEventTitle"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="E.g., Special Practice, Youth Night"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button onClick={handleAddEvent} variant="primary" size="md">Add Event</Button>
          </div>
        </div>

        {/* List of Events for Current Month */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Events in {MONTH_NAMES[currentDisplayDate.getMonth()]} {currentDisplayDate.getFullYear()}:</h3>
          {eventsForCurrentMonth.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-white custom-scrollbar">
              {eventsForCurrentMonth.map(event => (
                <li key={event.id} className="flex justify-between items-center p-2.5 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                  <div>
                    <span className="font-medium text-blue-700">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:</span>
                    <span className="ml-2 text-gray-800">{event.title}</span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    aria-label={`Delete event ${event.title}`}
                    className="px-2 py-1 text-xs"
                    leftIcon={<TrashIcon />}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 p-3 bg-gray-100 rounded-md">No custom events scheduled for this month.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageCustomEventsModal;