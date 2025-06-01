import React, { useState, useEffect, useMemo } from 'react';
import { SwapRequest, SwapRequestStatus, UserRole, ServiceType, User } from '../types';
import Modal from './Modal';
import Button from './Button';
import RoleBadge from './RoleBadge';
import { SERVICE_TYPE_ABBREVIATIONS } from '../constants';

interface AdminResolveSwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapRequest: SwapRequest | null;
  onResolve: (
    requestId: string,
    adminNotes?: string,
    replacementUserId?: string | null
  ) => void;
  allUsers: User[];
}

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`w-5 h-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdminResolveSwapRequestModal: React.FC<AdminResolveSwapRequestModalProps> = ({
  isOpen,
  onClose,
  swapRequest,
  onResolve,
  allUsers,
}) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedReplacementUserId, setSelectedReplacementUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && swapRequest) {
      setAdminNotes(swapRequest.adminNotes || '');
      setSelectedReplacementUserId(null); // Reset selection when modal opens
    } else if (!isOpen) {
      setAdminNotes('');
      setSelectedReplacementUserId(null);
    }
  }, [isOpen, swapRequest]);

  const availableReplacements = useMemo(() => {
    if (!swapRequest || !allUsers) return [];
    return allUsers.filter(user => 
      user.id !== swapRequest.requestingUserId && 
      user.roles.includes(swapRequest.role)
    );
  }, [allUsers, swapRequest]);

  if (!isOpen || !swapRequest) return null;

  const handleApprove = () => {
    onResolve(swapRequest.id, adminNotes.trim(), selectedReplacementUserId);
  };

  const formattedDate = new Date(swapRequest.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const requestedAtDate = new Date(swapRequest.requestedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolve Swap Request: ${swapRequest.requestingUserName}`}
      footer={
        <div className="flex w-full justify-between items-center">
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button 
                variant="primary" 
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                onClick={handleApprove}
                leftIcon={<CheckCircleIcon />}
            >
                {selectedReplacementUserId ? "Approve & Assign" : "Approve & Open Slot"}
            </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-800">Details of Request:</h3>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm space-y-1">
            <p><strong>User:</strong> {swapRequest.requestingUserName}</p>
            <p><strong>Requested Slot Date:</strong> {formattedDate}</p>
            <p><strong>Role:</strong> <RoleBadge role={swapRequest.role} /></p>
            {swapRequest.serviceType && (
              <p><strong>Service:</strong> {SERVICE_TYPE_ABBREVIATIONS[swapRequest.serviceType]}</p>
            )}
            <p><strong>Reason:</strong> <span className="italic">"{swapRequest.reason}"</span></p>
            <p><strong>Requested At:</strong> {requestedAtDate}</p>
          </div>
        </div>

        <div>
          <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes (Optional):
          </label>
          <textarea
            id="adminNotes"
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
            placeholder="E.g., Approved due to valid reason."
          />
        </div>
        
        <div>
            <label htmlFor="replacementUser" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Replacement (Optional):
            </label>
            <select
                id="replacementUser"
                value={selectedReplacementUserId || ''}
                onChange={(e) => setSelectedReplacementUserId(e.target.value || null)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                <option value="">-- No Replacement / Keep Slot Open --</option>
                {availableReplacements.length === 0 && <option disabled>No suitable replacements found</option>}
                {availableReplacements.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                ))}
            </select>
        </div>

        <p className="text-xs text-gray-500">
          If approved, the requesting user will be removed from the schedule. 
          If a replacement is selected, they will be assigned to this slot. Otherwise, the slot remains open.
        </p>
      </div>
    </Modal>
  );
};

export default AdminResolveSwapRequestModal;