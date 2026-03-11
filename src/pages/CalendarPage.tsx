import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, CheckCircle, Calendar, ArrowLeftRight, Send, UserCheck, ClipboardList } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  UserRole, ServiceType, DateStatusType, ROLE_LABELS, SERVICE_LABELS,
  ALL_ROLES, SERVICE_TYPES, MONTH_NAMES, DAYS_OF_WEEK,
  type Availability, type CustomEvent,
} from '../types';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dateStatuses, setDateStatuses] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [listTab, setListTab] = useState<'available' | 'assigned'>('available');

  // Swap state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapAvail, setSwapAvail] = useState<Availability | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapTargetId, setSwapTargetId] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [avails, statuses, evts] = await Promise.all([
        api.get<Availability[]>(`/availability?month=${month + 1}&year=${year}`),
        api.get<Record<string, string>>('/availability/date-statuses'),
        api.get<CustomEvent[]>('/events'),
      ]);
      setAvailabilities(avails);
      setDateStatuses(statuses);
      setEvents(evts);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const getDayAvailabilities = (dateStr: string) => {
    let avails = availabilities.filter(a => a.date === dateStr);
    if (filterRole) avails = avails.filter(a => a.role === filterRole);
    return avails;
  };

  const getDateEvent = (dateStr: string) => events.find(e => e.date === dateStr);
  const isServiceDay = (day: number) => { const d = new Date(year, month, day); return d.getDay() === 0 || d.getDay() === 4; };
  const isToday = (day: number) => year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  const formatDate = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleToggleAvailability = async (date: string, role: UserRole, serviceType: ServiceType | null, isCurrentlyAvailable: boolean) => {
    try {
      await api.post('/availability', { date, role, serviceType, isAvailable: !isCurrentlyAvailable });
      fetchData();
      toast.success(isCurrentlyAvailable ? 'Removed availability' : 'Marked as available');
    } catch { toast.error('Failed to update'); }
  };

  const handleDateStatus = async (date: string, status: DateStatusType | null) => {
    try { await api.put('/availability/date-status', { date, status }); fetchData(); }
    catch { toast.error('Failed to update date status'); }
  };

  const openSwapModal = (avail: Availability) => {
    setSwapAvail(avail);
    setSwapReason('');
    setSwapTargetId('');
    setShowSwapModal(true);
  };

  const handleSwapRequest = async () => {
    if (!swapAvail || !swapReason.trim()) return;
    setSwapLoading(true);
    try {
      const originalId = `${swapAvail.userId}::${swapAvail.date}::${swapAvail.role}::${swapAvail.serviceType || 'default'}`;
      await api.post('/swaps', {
        date: swapAvail.date,
        role: swapAvail.role,
        serviceType: swapAvail.serviceType,
        reason: swapReason.trim(),
        originalAvailabilityId: originalId,
      });
      toast.success('Swap request submitted!');
      setShowSwapModal(false);
      setSwapAvail(null);
      setSwapReason('');
      setSwapTargetId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit swap request');
    } finally { setSwapLoading(false); }
  };

  const selectedDateAvails = selectedDate ? getDayAvailabilities(selectedDate) : [];
  const selectedDateEvent = selectedDate ? getDateEvent(selectedDate) : null;
  const selectedDateStatus = selectedDate ? dateStatuses[selectedDate] : null;

  // Build Available and Assigned lists for the bottom section
  // "Assigned" = dates that are LOCKED or COMPLETED (admin has finalized)
  // "Available" = all other availabilities
  const assignedDates = new Set(Object.entries(dateStatuses).filter(([_, s]) => s === 'LOCKED' || s === 'COMPLETED').map(([d]) => d));
  const allFiltered = filterRole ? availabilities.filter(a => a.role === filterRole) : availabilities;
  const availableList = allFiltered.filter(a => !assignedDates.has(a.date));
  const assignedList = allFiltered.filter(a => assignedDates.has(a.date));

  // Dedupe by user for summary
  const dedupeByUser = (list: Availability[]) => {
    const map = new Map<string, { user: Availability['user']; avails: Availability[] }>();
    for (const a of list) {
      const key = a.userId;
      if (!map.has(key)) map.set(key, { user: a.user, avails: [] });
      map.get(key)!.avails.push(a);
    }
    return Array.from(map.values()).sort((a, b) => b.avails.length - a.avails.length);
  };

  const availableSummary = dedupeByUser(availableList);
  const assignedSummary = dedupeByUser(assignedList);

  // Find same-role available members for swap target selection
  const getSwapTargets = () => {
    if (!swapAvail) return [];
    return availabilities
      .filter(a => a.date === swapAvail.date && a.role === swapAvail.role && a.userId !== user?.id && a.serviceType === swapAvail.serviceType)
      .map(a => a.user)
      .filter((u): u is NonNullable<typeof u> => !!u);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[var(--shadow-card)] border border-white/60 overflow-hidden">
        <div className="px-4 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <button onClick={prevMonth} className="w-9 h-9 rounded-full hover:bg-[var(--color-surface)] flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
          <h2 className="text-[17px] font-bold text-[var(--color-text-primary)]">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-[var(--color-surface)] flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="px-4 py-3">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as UserRole | '')}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[14px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
            <option value="">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        <div className="px-3 pb-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-[11px] font-semibold text-[var(--color-text-muted)] py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day);
              const dayAvails = getDayAvailabilities(dateStr);
              const event = getDateEvent(dateStr);
              const status = dateStatuses[dateStr];
              const service = isServiceDay(day);
              const todayMark = isToday(day);
              return (
                <motion.button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative transition-all overflow-hidden
                    ${todayMark ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
                    ${service && !todayMark ? 'bg-blue-50/70' : ''}
                    ${!service && !todayMark && !event ? 'bg-white' : ''}
                    ${event && !todayMark ? 'bg-amber-50/70' : ''}
                    hover:bg-gray-100`}
                  whileTap={{ scale: 0.95 }}>
                  <span className={`text-[12px] font-semibold leading-none ${todayMark ? 'text-primary-600' : 'text-[var(--color-text-primary)]'}`}>{day}</span>
                  {(status || dayAvails.length > 0 || event) && (
                    <div className="flex items-center gap-[2px] mt-0.5">
                      {status === 'LOCKED' && <Lock className="w-[10px] h-[10px] text-yellow-500" />}
                      {status === 'COMPLETED' && <CheckCircle className="w-[10px] h-[10px] text-green-500" />}
                      {dayAvails.length > 0 && (
                        <div className="flex gap-[2px]">
                          {dayAvails.slice(0, 2).map(a => <div key={a.id} className="w-[5px] h-[5px] rounded-full bg-primary-500" />)}
                          {dayAvails.length > 2 && <span className="text-[7px] font-bold text-[var(--color-text-muted)] leading-none">+{dayAvails.length - 2}</span>}
                        </div>
                      )}
                      {event && <div className="w-[5px] h-[5px] rounded-full bg-amber-500" />}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-200" /> Service Day</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Event</span>
        </div>
      </div>

      {/* Available / Assigned Tabs */}
      {!loading && (availableSummary.length > 0 || assignedSummary.length > 0) && (
        <motion.div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[var(--shadow-card)] border border-white/60 overflow-hidden"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex border-b border-[var(--color-border)]">
            <button onClick={() => setListTab('available')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-colors relative ${
                listTab === 'available' ? 'text-primary-500' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}>
              <UserCheck className="w-4 h-4" />
              Available ({availableSummary.length})
              {listTab === 'available' && <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500" layoutId="calTab" />}
            </button>
            <button onClick={() => setListTab('assigned')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-colors relative ${
                listTab === 'assigned' ? 'text-green-600' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}>
              <ClipboardList className="w-4 h-4" />
              Assigned ({assignedSummary.length})
              {listTab === 'assigned' && <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500" layoutId="calTab" />}
            </button>
          </div>

          <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
            {(listTab === 'available' ? availableSummary : assignedSummary).map(({ user: memberUser, avails }) => (
              <div key={memberUser?.id || avails[0].userId} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface)] transition-colors">
                <Avatar src={memberUser?.avatarUrl} name={memberUser?.displayName || ''} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">{memberUser?.displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {[...new Set(avails.map(a => a.role))].map(r => <Badge key={r} role={r} size="sm" />)}
                  </div>
                </div>
                <span className={`text-[12px] font-semibold shrink-0 ${listTab === 'assigned' ? 'text-green-600' : 'text-primary-500'}`}>
                  {avails.length} day{avails.length !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
            {(listTab === 'available' ? availableSummary : assignedSummary).length === 0 && (
              <div className="py-8 text-center text-[14px] text-[var(--color-text-muted)]">
                No {listTab} members this month
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Date Detail Modal */}
      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)}
        title={selectedDate ? new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
        footer={user?.isAdmin && selectedDate ? (
          <div className="flex gap-2 flex-wrap">
            {selectedDateStatus !== 'LOCKED' && (
              <button onClick={() => handleDateStatus(selectedDate, DateStatusType.LOCKED)} className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-[12px] font-semibold hover:bg-yellow-200 transition-colors">
                <Lock className="w-3.5 h-3.5" /> Lock
              </button>
            )}
            {selectedDateStatus !== 'COMPLETED' && (
              <button onClick={() => handleDateStatus(selectedDate, DateStatusType.COMPLETED)} className="flex items-center gap-1.5 px-3.5 py-2 bg-green-100 text-green-700 rounded-lg text-[12px] font-semibold hover:bg-green-200 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </button>
            )}
            {selectedDateStatus && (
              <button onClick={() => handleDateStatus(selectedDate, null)} className="px-3.5 py-2 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-semibold hover:bg-gray-200 transition-colors">
                Clear Status
              </button>
            )}
          </div>
        ) : undefined}>
        {selectedDate && (
          <div className="space-y-5">
            {selectedDateEvent && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-[14px] text-amber-800">{selectedDateEvent.title}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[14px] font-bold mb-3 text-[var(--color-text-primary)]">Your Availability</h3>
              <div className="space-y-2">
                {user?.roles.filter(r => r !== UserRole.ADMIN).map(role => {
                  const isSunday = new Date(selectedDate + 'T00:00').getDay() === 0;
                  if (isSunday) {
                    return SERVICE_TYPES.map(st => {
                      const isAvailable = availabilities.some(a => a.userId === user.id && a.date === selectedDate && a.role === role && a.serviceType === st);
                      const myAvail = availabilities.find(a => a.userId === user.id && a.date === selectedDate && a.role === role && a.serviceType === st);
                      const isAssigned = assignedDates.has(selectedDate);
                      return (
                        <div key={`${role}-${st}`} className="flex items-center gap-2">
                          <button onClick={() => handleToggleAvailability(selectedDate, role, st, isAvailable)}
                            disabled={selectedDateStatus === 'LOCKED'}
                            className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                              isAvailable ? 'bg-primary-50 border-primary-300' : 'bg-white border-[var(--color-border)] hover:border-gray-300'
                            } ${selectedDateStatus === 'LOCKED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Badge role={role} />
                              <span className="text-[12px] text-[var(--color-text-secondary)] truncate">{SERVICE_LABELS[st]}</span>
                              {isAssigned && isAvailable && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Assigned</span>}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                              isAvailable ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                            }`}>
                              {isAvailable && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                          {isAvailable && myAvail && isAssigned && (
                            <button onClick={() => openSwapModal(myAvail)}
                              className="shrink-0 w-9 h-9 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-colors text-orange-600" title="Request Swap">
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  }
                  const isAvailable = availabilities.some(a => a.userId === user.id && a.date === selectedDate && a.role === role && !a.serviceType);
                  const myAvail = availabilities.find(a => a.userId === user.id && a.date === selectedDate && a.role === role && !a.serviceType);
                  const isAssigned = assignedDates.has(selectedDate);
                  return (
                    <div key={role} className="flex items-center gap-2">
                      <button onClick={() => handleToggleAvailability(selectedDate, role, null, isAvailable)}
                        disabled={selectedDateStatus === 'LOCKED'}
                        className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isAvailable ? 'bg-primary-50 border-primary-300' : 'bg-white border-[var(--color-border)] hover:border-gray-300'
                        } ${selectedDateStatus === 'LOCKED' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Badge role={role} />
                          {isAssigned && isAvailable && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Assigned</span>}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isAvailable ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                        }`}>
                          {isAvailable && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                      {isAvailable && myAvail && isAssigned && (
                        <button onClick={() => openSwapModal(myAvail)}
                          className="shrink-0 w-9 h-9 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-colors text-orange-600" title="Request Swap">
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDateAvails.length > 0 && (
              <div>
                <h3 className="text-[14px] font-bold mb-3 text-[var(--color-text-primary)]">Team Available</h3>
                <div className="space-y-2">
                  {selectedDateAvails.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)]">
                      <Avatar src={a.user?.avatarUrl} name={a.user?.displayName || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate">{a.user?.displayName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge role={a.role} size="sm" />
                          {a.serviceType && <span className="text-[11px] text-[var(--color-text-muted)]">{SERVICE_LABELS[a.serviceType]}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Swap Request Modal */}
      <Modal isOpen={showSwapModal} onClose={() => { setShowSwapModal(false); setSwapAvail(null); setSwapReason(''); setSwapTargetId(''); }}
        title="Request Swap" maxWidth="max-w-md">
        {swapAvail && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5">
              <p className="text-[13px] text-orange-800">
                Swap your <strong>{ROLE_LABELS[swapAvail.role]}</strong> on{' '}
                <strong>{new Date(swapAvail.date + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>
                {swapAvail.serviceType && <> ({SERVICE_LABELS[swapAvail.serviceType]})</>}
              </p>
            </div>

            {/* Select swap target - same role members available that day */}
            {getSwapTargets().length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
                  Swap with (same role)
                </label>
                <div className="space-y-2">
                  {getSwapTargets().map(t => (
                    <button key={t.id} onClick={() => setSwapTargetId(t.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        swapTargetId === t.id ? 'bg-orange-50 border-orange-300' : 'bg-white border-[var(--color-border)] hover:border-gray-300'
                      }`}>
                      <Avatar src={t.avatarUrl} name={t.displayName} size="sm" />
                      <span className="text-[14px] font-medium">{t.displayName}</span>
                      {swapTargetId === t.id && <CheckCircle className="w-4 h-4 text-orange-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Reason</label>
              <textarea value={swapReason} onChange={e => setSwapReason(e.target.value)} placeholder="Why do you need to swap?"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[14px] resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" rows={3} />
            </div>

            <motion.button onClick={handleSwapRequest} disabled={!swapReason.trim() || swapLoading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.98 }}>
              {swapLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit Swap Request</>}
            </motion.button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
