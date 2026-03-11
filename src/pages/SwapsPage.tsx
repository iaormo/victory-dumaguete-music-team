import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Clock, CheckCircle2, XCircle, MessageSquare, ChevronDown } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { SwapRequestStatus, ROLE_LABELS, SERVICE_LABELS, type SwapRequest, type User } from '../types';

const STATUS_CONFIG = {
  [SwapRequestStatus.PENDING]: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  [SwapRequestStatus.APPROVED]: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Approved' },
  [SwapRequestStatus.REJECTED]: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
};

const SwapsPage: React.FC = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');
  const [resolveSwap, setResolveSwap] = useState<SwapRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [replacementUserId, setReplacementUserId] = useState('');

  const fetchSwaps = useCallback(async () => {
    try {
      const data = await api.get<SwapRequest[]>('/swaps');
      setSwaps(data);
    } catch {
      toast.error('Failed to load swaps');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await api.get<User[]>('/users');
      setMembers(data);
    } catch {}
  }, []);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);
  useEffect(() => { if (user?.isAdmin) fetchMembers(); }, [user?.isAdmin, fetchMembers]);

  const handleResolve = async (status: 'APPROVED' | 'REJECTED') => {
    if (!resolveSwap) return;
    try {
      await api.put(`/swaps/${resolveSwap.id}/resolve`, {
        status,
        adminNotes: adminNotes.trim() || null,
        replacementUserId: status === 'APPROVED' ? replacementUserId || null : null,
      });
      toast.success(`Swap ${status.toLowerCase()}`);
      setResolveSwap(null);
      setAdminNotes('');
      setReplacementUserId('');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve swap');
    }
  };

  const displayed = filter === 'mine'
    ? swaps.filter(s => s.requestingUserId === user?.id)
    : swaps;

  const pending = displayed.filter(s => s.status === SwapRequestStatus.PENDING);
  const resolved = displayed.filter(s => s.status !== SwapRequestStatus.PENDING);

  return (
    <div className="space-y-4">
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-primary-500" />
            <h1 className="text-[17px] font-bold">Swap Requests</h1>
          </div>

          {user?.isAdmin && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['mine', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                    filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {f === 'mine' ? 'My Swaps' : 'All Swaps'}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 space-y-2">
                <div className="w-32 h-4 skeleton" />
                <div className="w-48 h-3 skeleton" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[15px] text-gray-500 font-medium">No swap requests</p>
            <p className="text-[13px] text-gray-400 mt-1">Request a swap from the Calendar when assigned</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-3">
                  Pending ({pending.length})
                </h3>
                <div className="space-y-2">
                  {pending.map((swap, i) => (
                    <SwapCard
                      key={swap.id}
                      swap={swap}
                      index={i}
                      isAdmin={!!user?.isAdmin}
                      isOwn={swap.requestingUserId === user?.id}
                      onResolve={() => setResolveSwap(swap)}
                    />
                  ))}
                </div>
              </div>
            )}

            {resolved.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Resolved ({resolved.length})
                </h3>
                <div className="space-y-2">
                  {resolved.map((swap, i) => (
                    <SwapCard
                      key={swap.id}
                      swap={swap}
                      index={i}
                      isAdmin={!!user?.isAdmin}
                      isOwn={swap.requestingUserId === user?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={!!resolveSwap}
        onClose={() => { setResolveSwap(null); setAdminNotes(''); setReplacementUserId(''); }}
        title="Resolve Swap Request"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleResolve('REJECTED')}
              className="px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => handleResolve('APPROVED')}
              className="px-5 py-2.5 bg-emerald-500 text-white text-[14px] font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Approve
            </button>
          </div>
        }
      >
        {resolveSwap && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-[13px]">
              <p><span className="font-semibold">{resolveSwap.requestingUser.displayName}</span> wants to swap</p>
              <p className="text-gray-500 mt-1">
                {ROLE_LABELS[resolveSwap.role]} on {resolveSwap.date}
                {resolveSwap.serviceType && ` (${SERVICE_LABELS[resolveSwap.serviceType]})`}
              </p>
              <p className="text-gray-500 mt-1">Reason: {resolveSwap.reason}</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Replacement Member (Optional)
              </label>
              <div className="relative">
                <select
                  value={replacementUserId}
                  onChange={e => setReplacementUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] focus:ring-2 focus:ring-primary-500 appearance-none"
                >
                  <option value="">No replacement</option>
                  {members
                    .filter(m => m.id !== resolveSwap.requestingUserId && m.roles.includes(resolveSwap.role))
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.displayName}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Add a note..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const SwapCard: React.FC<{
  swap: SwapRequest;
  index: number;
  isAdmin: boolean;
  isOwn: boolean;
  onResolve?: () => void;
}> = ({ swap, index, isAdmin, isOwn, onResolve }) => {
  const config = STATUS_CONFIG[swap.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start gap-3">
        <Avatar src={swap.requestingUser.avatarUrl} name={swap.requestingUser.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold">{swap.requestingUser.displayName}</span>
            <Badge role={swap.role} size="sm" />
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-[13px] text-gray-500 mt-1">
            {swap.date}{swap.serviceType && ` · ${SERVICE_LABELS[swap.serviceType]}`}
          </p>
          <div className="flex items-start gap-1.5 mt-2">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[13px] text-gray-600">{swap.reason}</p>
          </div>
          {swap.adminNotes && (
            <p className="text-[12px] text-gray-400 mt-1.5 italic">Admin: {swap.adminNotes}</p>
          )}
        </div>

        {isAdmin && swap.status === SwapRequestStatus.PENDING && onResolve && (
          <motion.button
            onClick={onResolve}
            className="shrink-0 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-[12px] font-semibold hover:bg-primary-100 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Resolve
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default SwapsPage;
