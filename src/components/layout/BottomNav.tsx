import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CalendarDays, ArrowLeftRight, Users, User } from 'lucide-react';
import api from '../../api/client';

const FEED_LAST_READ_KEY = 'vdmt_feed_last_read';
const SWAPS_LAST_READ_KEY = 'vdmt_swaps_last_read';

const navItems = [
  { to: '/', icon: Home, label: 'Feed', badgeKey: 'newPosts' as const },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar', badgeKey: null },
  { to: '/swaps', icon: ArrowLeftRight, label: 'Swaps', badgeKey: 'pendingSwaps' as const },
  { to: '/members', icon: Users, label: 'Team', badgeKey: null },
  { to: '/profile', icon: User, label: 'Profile', badgeKey: null },
];

interface BadgeCounts {
  newPosts: number;
  pendingSwaps: number;
  unreadNotifications: number;
}

const BottomNav: React.FC = () => {
  const location = useLocation();
  const [counts, setCounts] = useState<BadgeCounts>({ newPosts: 0, pendingSwaps: 0, unreadNotifications: 0 });

  // Mark pages as read when visiting them
  useEffect(() => {
    if (location.pathname === '/') {
      localStorage.setItem(FEED_LAST_READ_KEY, new Date().toISOString());
    } else if (location.pathname === '/swaps') {
      localStorage.setItem(SWAPS_LAST_READ_KEY, new Date().toISOString());
    }
  }, [location.pathname]);

  const fetchCounts = useCallback(async () => {
    try {
      const feedLastRead = localStorage.getItem(FEED_LAST_READ_KEY);
      const swapsLastRead = localStorage.getItem(SWAPS_LAST_READ_KEY);
      const params = new URLSearchParams();
      if (feedLastRead) params.set('feedLastRead', feedLastRead);
      if (swapsLastRead) params.set('swapsLastRead', swapsLastRead);
      const data = await api.get<BadgeCounts>(`/badge-counts?${params.toString()}`);
      setCounts(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Re-fetch when location changes (to clear badges on visited pages)
  useEffect(() => {
    const timer = setTimeout(fetchCounts, 500);
    return () => clearTimeout(timer);
  }, [location.pathname, fetchCounts]);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 safe-area-bottom">
      <motion.div
        className="flex items-end gap-1 px-3 py-2 rounded-2xl glass-heavy border border-white/40 shadow-[var(--shadow-dock)]"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      >
        {navItems.map(({ to, icon: Icon, label, badgeKey }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          const badgeCount = badgeKey ? counts[badgeKey] : 0;

          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center"
            >
              <motion.div
                className={`relative flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-colors ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="relative">
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {badgeCount > 0 && !isActive && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
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
