import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Clock, CheckCircle2, XCircle, MessageSquare, ArrowRight } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { SwapRequestStatus, ROLE_LABELS, SERVICE_LABELS, type SwapRequest } from '../types';

const STATUS_CONFIG = {
  [SwapRequestStatus.PENDING]: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  [SwapRequestStatus.APPROVED]: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Accepted' },
  [SwapRequestStatus.REJECTED]: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Declined' },
};

type Tab = 'incoming' | 'sent';

const SwapsPage: React.FC = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('incoming');
  const [responding, setResponding] = useState<string | null>(null);

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

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  const handleRespond = async (swapId: string, status: 'APPROVED' | 'REJECTED') => {
    setResponding(swapId);
    try {
      await api.put(`/swaps/${swapId}/respond`, { status });
      toast.success(status === 'APPROVED' ? 'Swap accepted!' : 'Swap declined');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  const incoming = swaps.filter(s => s.targetUserId === user?.id);
  const sent = swaps.filter(s => s.requestingUserId === user?.id);
  const displayed = tab === 'incoming' ? incoming : sent;

  const incomingPendingCount = incoming.filter(s => s.status === SwapRequestStatus.PENDING).length;

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
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 mb-5">
          {([
            { key: 'incoming' as Tab, label: 'Incoming', count: incomingPendingCount },
            { key: 'sent' as Tab, label: 'My Requests', count: 0 },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 relative px-3 py-2 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
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
            <p className="text-[15px] text-gray-500 font-medium">
              {tab === 'incoming' ? 'No incoming swap requests' : 'No swap requests sent'}
            </p>
            <p className="text-[13px] text-gray-400 mt-1">
              {tab === 'incoming'
                ? 'When someone asks you to swap, it will appear here'
                : 'Request a swap from the Calendar when assigned'}
            </p>
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
                      currentUserId={user?.id || ''}
                      tab={tab}
                      responding={responding === swap.id}
                      onAccept={() => handleRespond(swap.id, 'APPROVED')}
                      onDecline={() => handleRespond(swap.id, 'REJECTED')}
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
                      currentUserId={user?.id || ''}
                      tab={tab}
                      responding={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SwapCard: React.FC<{
  swap: SwapRequest;
  index: number;
  currentUserId: string;
  tab: Tab;
  responding: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}> = ({ swap, index, currentUserId, tab, responding, onAccept, onDecline }) => {
  const config = STATUS_CONFIG[swap.status];
  const StatusIcon = config.icon;
  const isIncoming = tab === 'incoming';
  const isPending = swap.status === SwapRequestStatus.PENDING;

  return (
    <motion.div
      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={isIncoming ? swap.requestingUser.avatarUrl : (swap.targetUser?.avatarUrl || null)}
          name={isIncoming ? swap.requestingUser.displayName : (swap.targetUser?.displayName || '?')}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isIncoming ? (
              <span className="text-[14px] font-semibold">{swap.requestingUser.displayName}</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-gray-500">To</span>
                <span className="text-[14px] font-semibold">{swap.targetUser?.displayName || 'Unknown'}</span>
              </div>
            )}
            <Badge role={swap.role} size="sm" />
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          {isIncoming && (
            <p className="text-[13px] text-primary-600 font-medium mt-1">
              Wants you to cover their {ROLE_LABELS[swap.role]} slot
            </p>
          )}

          <p className="text-[13px] text-gray-500 mt-1">
            {swap.date}{swap.serviceType && ` · ${SERVICE_LABELS[swap.serviceType]}`}
          </p>
          <div className="flex items-start gap-1.5 mt-2">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[13px] text-gray-600">{swap.reason}</p>
          </div>

          {/* Accept / Decline buttons for incoming pending */}
          {isIncoming && isPending && onAccept && onDecline && (
            <div className="flex items-center gap-2 mt-3">
              <motion.button
                onClick={onAccept}
                disabled={responding}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
              >
                {responding ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Accept
              </motion.button>
              <motion.button
                onClick={onDecline}
                disabled={responding}
                className="flex items-center gap-1.5 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
              >
                <XCircle className="w-3.5 h-3.5" />
                Decline
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SwapsPage;
