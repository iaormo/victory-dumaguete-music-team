import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, User, ChevronDown, Shield, HelpCircle, X, ChevronRight, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import api from '../../api/client';
import type { AppNotification } from '../../types';

const helpSections = [
  {
    title: 'Getting Started',
    items: [
      { q: 'How do I create an account?', a: 'Go to the Sign Up page, enter your name, email, password, and select your instrument roles. You can also add a profile photo and username.' },
      { q: 'How do I log in?', a: 'Use your email or username along with your password on the Sign In page.' },
      { q: 'How do I update my profile?', a: 'Go to Profile (bottom nav) to update your display name, username, avatar photo, birthday, phone number, and address. Click Save Changes when done.' },
    ],
  },
  {
    title: 'Feed & Posts',
    items: [
      { q: 'How do I create a post?', a: 'On the Feed page (Home), type in the text box at the top and click Post. You can also attach a photo by clicking the Photo button.' },
      { q: 'How do I react to a post?', a: 'Click the reaction button below any post and select an emoji. Click the same emoji again to remove your reaction.' },
      { q: 'How do I comment on a post?', a: 'Click the comment icon below a post, type your comment, and press Enter or click send.' },
      { q: 'How do I delete a post?', a: 'Click the three dots (...) menu on your post and select Delete. Admins can delete any post.' },
    ],
  },
  {
    title: 'Groups & Channels',
    items: [
      { q: 'How do I create a group?', a: 'On the Feed page, click the + button next to the channel name. Enter a group name, description, set visibility (public/private), and add members.' },
      { q: 'How do I send messages in a group?', a: 'Select a group channel from the dropdown, then type your message in the input box at the bottom. You can also send photos.' },
      { q: 'How do I join or leave a group?', a: 'Open a public group and click Join. To leave, click the Leave button in the group info card.' },
    ],
  },
  {
    title: 'Calendar & Availability',
    items: [
      { q: 'How do I set my availability?', a: 'Go to Calendar, select a date, then toggle your availability for each role and service type (Main Service, Kids AM, Kids PM).' },
      { q: 'What do the green and red icons mean?', a: 'Green check means you are available on that date. Red X means you are not available.' },
      { q: 'How do I view who is available?', a: 'Click on any date in the calendar to see all team members\' availability for that day.' },
    ],
  },
  {
    title: 'Swap Requests',
    items: [
      { q: 'How do I request a swap?', a: 'Go to Swaps, click New Swap Request, select the date, your role, replacement person, and provide a reason. Both replacement and reason are required.' },
      { q: 'How are swaps approved?', a: 'Admins review pending swap requests and can approve or reject them with optional notes.' },
      { q: 'How do I see my swap status?', a: 'Go to Swaps to see all your pending and resolved requests with their current status.' },
    ],
  },
  {
    title: 'Admin Features',
    items: [
      { q: 'How do I manage team members?', a: 'Go to Team page. Click the edit icon on any member to update their name, birthday, phone, address, roles, or reset their password.' },
      { q: 'How do I reset a member\'s password?', a: 'Edit a member and click "Reset Password to Default" at the bottom. This sets their password to the default (victory2024).' },
      { q: 'How do I add a new member?', a: 'On the Team page, click the Add button, enter their name, email, and assign roles.' },
      { q: 'How do I view the app as another user?', a: 'Click the Login icon next to a member\'s name on the Team page to impersonate them. An amber banner will appear at the top - click "Return to Admin" to switch back.' },
    ],
  },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<AppNotification[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    setBellOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 glass-dark border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <span className="font-bold text-[15px] tracking-tight">Victory Music Team Dumaguete</span>
          </Link>

          <div className="flex items-center gap-2">
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[var(--shadow-modal)] border border-gray-200 overflow-hidden z-50"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-[14px] font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[12px] text-primary-500 font-medium hover:text-primary-600"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-[13px] text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                              !notif.isRead ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            <Avatar src={notif.from.avatarUrl} name={notif.from.displayName} size="sm" className="shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className={`text-[13px] leading-snug ${!notif.isRead ? 'font-semibold' : 'text-gray-600'}`}>
                                {notif.message}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setHelpOpen(true)}
              className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              title="Help & FAQ"
            >
              <HelpCircle className="w-[18px] h-[18px]" />
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

      {/* Help & FAQ Modal */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHelpOpen(false)} />
            <motion.div
              className="relative w-full max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-primary-500" />
                  <h2 className="text-[17px] font-bold">Help & FAQ</h2>
                </div>
                <button onClick={() => setHelpOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-4.5 h-4.5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {helpSections.map((section, si) => (
                  <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === si ? null : si)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[14px] font-bold text-gray-800">{section.title}</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === si ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {expandedSection === si && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100"
                        >
                          <div className="px-3 py-2 space-y-1">
                            {section.items.map((item, ii) => {
                              const key = `${si}-${ii}`;
                              return (
                                <div key={ii} className="rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => setExpandedItem(expandedItem === key ? null : key)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50 rounded-lg transition-colors"
                                  >
                                    <span className="text-[13px] font-semibold text-primary-600">{item.q}</span>
                                  </button>
                                  <AnimatePresence>
                                    {expandedItem === key && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-3 pb-2"
                                      >
                                        <p className="text-[13px] text-gray-600 leading-relaxed pl-3 border-l-2 border-primary-200">
                                          {item.a}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
