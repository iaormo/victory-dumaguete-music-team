
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ALL_MANAGEABLE_ROLES } from '../constants'; 
import Modal from './Modal';
import Button from './Button';

interface EditUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSaveRoles: (userId: string, newRoles: UserRole[]) => void;
}

const EditUserRolesModal: React.FC<EditUserRolesModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaveRoles,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());

  useEffect(() => {
    if (userToEdit) {
      setSelectedRoles(new Set(userToEdit.roles));
    } else {
      setSelectedRoles(new Set());
    }
  }, [userToEdit, isOpen]);

  if (!isOpen || !userToEdit) return null;

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

  const handleSave = () => {
    onSaveRoles(userToEdit.id, Array.from(selectedRoles));
    onClose();
  };
  
  const isLastAdminRoleForThisUser = userToEdit.isAdmin && userToEdit.roles.filter(r => r === UserRole.ADMIN).length === 1;


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Roles for ${userToEdit.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Select the roles for this team member. The 'Admin' role grants administrative privileges.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
          {ALL_MANAGEABLE_ROLES.map(role => {
            const isChecked = selectedRoles.has(role);
            const isDisabled = role === UserRole.ADMIN && isChecked && isLastAdminRoleForThisUser && userToEdit.roles.includes(UserRole.ADMIN); 
            
            return (
              <label
                key={role}
                htmlFor={`role-${role}`}
                className={`flex items-center space-x-2 p-3 rounded-md border transition-all cursor-pointer hover:border-blue-400
                  ${isChecked ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' : 'bg-gray-50 border-gray-300'}
                  ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  id={`role-${role}`}
                  value={role}
                  checked={isChecked}
                  onChange={() => handleRoleToggle(role)}
                  disabled={isDisabled}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${isChecked ? 'text-blue-700' : 'text-gray-700'}`}>{role}</span>
              </label>
            );
          })}
        </div>
        {isLastAdminRoleForThisUser && selectedRoles.has(UserRole.ADMIN) && (
            <p className="text-xs text-orange-600 mt-2">To remove the 'Admin' role, ensure another user has administrative privileges or assign it to another user first.</p>
        )}
      </div>
    </Modal>
  );
};

export default EditUserRolesModal;