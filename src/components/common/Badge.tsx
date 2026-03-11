import React from 'react';
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '../../types';

interface BadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ role, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`${ROLE_COLORS[role]} ${sizeClasses} rounded-full font-semibold inline-block whitespace-nowrap`}>
      {ROLE_LABELS[role]}
    </span>
  );
};

export default Badge;
