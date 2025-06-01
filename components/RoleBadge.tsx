
import React from 'react';
import { UserRole } from '../types';
import { ROLE_COLORS } from '../constants';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const colorClasses = ROLE_COLORS[role] || 'bg-gray-400 text-white';
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClasses} ${className}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
