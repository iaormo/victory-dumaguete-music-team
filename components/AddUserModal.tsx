
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ALL_MANAGEABLE_ROLES } from '../constants';
import Modal from './Modal';
import Button from './Button';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (originalNameHint: string, email: string, roles: UserRole[]) => boolean; // Returns true on success
  existingUsers: User[]; // To help with email validation display
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSaveUser,
  existingUsers,
}) => {
  const [originalNameHint, setOriginalNameHint] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());
  const [emailError, setEmailError] = useState('');

  const resetForm = () => {
    setOriginalNameHint('');
    setEmail('');
    setSelectedRoles(new Set());
    setEmailError('');
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev => {
      const newRoles = new Set(prev);
      if (newRoles.has(role)) {
        newRoles.delete(role);
      } else {
        newRoles.add(role);
      }
      return newRoles;
    });
  };

  const validateEmail = (currentEmail: string): boolean => {
    if (!currentEmail.trim()) {
      setEmailError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(currentEmail)) {
      setEmailError('Invalid email format.');
      return false;
    }
    if (existingUsers.some(u => u.email.toLowerCase() === currentEmail.toLowerCase())) {
      setEmailError('This email address is already in use.');
      return false;
    }
    setEmailError('');
    return true;
  };


  const handleSave = () => {
    if (!originalNameHint.trim()) {
        alert("Original Name Hint cannot be empty."); // Or set an error state
        return;
    }
    if (!validateEmail(email)) {
        return;
    }
    if (selectedRoles.size === 0) {
        if(!confirm("No roles selected for this user. Proceed anyway?")) {
            return;
        }
    }

    const success = onSaveUser(originalNameHint, email, Array.from(selectedRoles));
    if (success) {
      resetForm();
      onClose();
    } else {
      // onSaveUser might show an alert for existing email, or we can rely on validateEmail
      // If onSaveUser returns false for other reasons, an error state could be set here.
      // For now, we assume onSaveUser handles critical alerts like duplicate email directly.
      // And validateEmail handles UI feedback before attempting save.
    }
  };
  
  const handleModalClose = () => {
    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Add New Team Member"
      footer={
        <>
          <Button variant="secondary" onClick={handleModalClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Add User</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="originalNameHint" className="block text-sm font-medium text-gray-700">Original Name / Hint</label>
          <input
            type="text"
            id="originalNameHint"
            value={originalNameHint}
            onChange={(e) => setOriginalNameHint(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., John D."
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value); // Clear error as user types if it was set
            }}
            onBlur={() => validateEmail(email)} // Validate on blur
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            placeholder="user@example.com"
            required
          />
          {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Roles</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 border rounded-md bg-gray-50 custom-scrollbar">
            {ALL_MANAGEABLE_ROLES.map(role => {
              const isChecked = selectedRoles.has(role);
              return (
                <label
                  key={role}
                  htmlFor={`add-role-${role}`}
                  className={`flex items-center space-x-2 p-2 rounded-md border transition-all cursor-pointer hover:border-blue-300
                    ${isChecked ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-300' : 'bg-white border-gray-200'}`}
                >
                  <input
                    type="checkbox"
                    id={`add-role-${role}`}
                    value={role}
                    checked={isChecked}
                    onChange={() => handleRoleToggle(role)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isChecked ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{role}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddUserModal;