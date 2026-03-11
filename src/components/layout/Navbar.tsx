import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, User, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-40 glass-dark border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <span className="font-bold text-[15px] tracking-tight">Victory Music Team Dumaguete</span>
        </Link>

        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <Bell className="w-[18px] h-[18px]" />
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full pl-0.5 pr-2.5 py-0.5 bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Avatar src={user?.avatarUrl} name={user?.displayName || ''} size="xs" />
              <span className="text-[13px] font-medium text-white hidden sm:block max-w-[100px] truncate">
                {user?.displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-60 glass-heavy rounded-2xl shadow-[var(--shadow-modal)] border border-white/40 overflow-hidden z-50"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="p-3.5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <Avatar src={user?.avatarUrl} name={user?.displayName || ''} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[14px] truncate">{user?.displayName}</p>
                        <p className="text-[12px] text-[var(--color-text-secondary)] truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors rounded-lg mx-1">
                      <User className="w-[18px] h-[18px] text-[var(--color-text-secondary)]" />
                      <span className="text-[14px] font-medium">Profile</span>
                    </Link>
                    {user?.isAdmin && (
                      <Link to="/members" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors rounded-lg mx-1">
                        <Shield className="w-[18px] h-[18px] text-[var(--color-text-secondary)]" />
                        <span className="text-[14px] font-medium">Manage Team</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-[calc(100%-8px)] flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 rounded-lg mx-1"
                    >
                      <LogOut className="w-[18px] h-[18px]" />
                      <span className="text-[14px] font-medium">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
