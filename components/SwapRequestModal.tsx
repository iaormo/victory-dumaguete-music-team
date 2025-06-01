
import React, { useState, useEffect } from 'react';
import { User, UserRole, ServiceType } from '../types';
import Modal from './Modal';
import Button from './Button';
import RoleBadge from './RoleBadge';
import { SERVICE_TYPE_ABBREVIATIONS } from '../constants';

interface SlotDetails {
  date: string; // YYYY-MM-DD
  role: UserRole;
  serviceType?: ServiceType;
  originalAvailabilityId: string;
}

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotDetails: SlotDetails;
  requestingUser: User;
  onSubmitRequest: (reason: string) => void;
}

const ArrowPathRoundedSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-6 h-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);


const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  isOpen,
  onClose,
  slotDetails,
  requestingUser,
  onSubmitRequest,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your swap request.');
      return;
    }
    setError('');
    onSubmitRequest(reason.trim());
    // onClose(); // Let the parent component handle closing after submission if needed
  };

  if (!isOpen || !slotDetails || !requestingUser) return null;

  const formattedDate = new Date(slotDetails.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Slot Swap"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} leftIcon={<ArrowPathRoundedSquareIcon className="w-5 h-5"/>}>
            Submit Request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">You are requesting to swap the following slot:</h3>
          <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-sm">
            <p><strong>Date:</strong> {formattedDate}</p>
            <p><strong>Role:</strong> <RoleBadge role={slotDetails.role} /></p>
            {slotDetails.serviceType && (
              <p><strong>Service:</strong> {SERVICE_TYPE_ABBREVIATIONS[slotDetails.serviceType]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="swapReason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Swap Request:
          </label>
          <textarea
            id="swapReason"
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
            placeholder="Please provide a brief reason (e.g., unexpected appointment, illness)."
            aria-describedby="reason-error"
            aria-invalid={!!error}
          />
          {error && (
            <p id="reason-error" className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Your request will be sent to the administrator for approval. If approved, you will be removed from this slot.
        </p>
      </div>
    </Modal>
  );
};

export default SwapRequestModal;
