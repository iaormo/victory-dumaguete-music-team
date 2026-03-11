import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CalendarDays, ArrowLeftRight, Users, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/swaps', icon: ArrowLeftRight, label: 'Swaps' },
  { to: '/members', icon: Users, label: 'Team' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 safe-area-bottom">
      <motion.div
        className="flex items-end gap-1 px-3 py-2 rounded-2xl glass-heavy border border-white/40 shadow-[var(--shadow-dock)]"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      >
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center"
            >
              <motion.div
                className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-colors ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className="text-[10px] font-semibold mt-1 leading-none">{label}</span>
              </motion.div>

              {isActive && (
                <motion.div
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary-500"
                  layoutId="dockDot"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
            </NavLink>
          );
        })}
      </motion.div>
    </nav>
  );
};

export default BottomNav;
