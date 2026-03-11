import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import type { Comment as CommentType } from '../../types';

interface CommentSectionProps {
  announcementId: string;
  comments: CommentType[];
  onUpdate: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ announcementId, comments, onUpdate }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const handleComment = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/announcements/${announcementId}/comments`, { content: text.trim() });
      setText('');
      onUpdate();
    } catch {}
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/announcements/comments/${commentId}/replies`, { content: replyText.trim() });
      setReplyText('');
      setReplyTo(null);
      setExpandedReplies(prev => new Set(prev).add(commentId));
      onUpdate();
    } catch {}
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="px-4 py-3 max-h-72 overflow-y-auto space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="animate-fade-in">
            <div className="flex gap-2">
              <Avatar src={comment.author.avatarUrl} name={comment.author.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold">{comment.author.displayName}</p>
                  <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  <button
                    onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(''); }}
                    className="text-[10px] font-semibold text-[var(--color-text-secondary)] hover:text-primary-500"
                  >
                    Reply
                  </button>
                </div>

                {comment.replies.length > 0 && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-primary-500 hover:underline px-1"
                  >
                    {expandedReplies.has(comment.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {comment.replies.length} repl{comment.replies.length !== 1 ? 'ies' : 'y'}
                  </button>
                )}

                <AnimatePresence>
                  {expandedReplies.has(comment.id) && comment.replies.map(reply => (
                    <motion.div
                      key={reply.id}
                      className="flex gap-2 mt-2 ml-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Avatar src={reply.author.avatarUrl} name={reply.author.displayName} size="xs" />
                      <div className="bg-white rounded-xl px-3 py-1.5">
                        <p className="text-[10px] font-semibold">{reply.author.displayName}</p>
                        <p className="text-xs text-[var(--color-text-primary)]">{reply.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {replyTo === comment.id && (
                  <motion.div
                    className="flex items-center gap-2 mt-2 ml-2"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Avatar src={user?.avatarUrl} name={user?.displayName || ''} size="xs" />
                    <div className="flex-1 flex items-center bg-white rounded-full border border-[var(--color-border)] overflow-hidden">
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply(comment.id)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-1.5 text-xs bg-transparent focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim()}
                        className="px-2 py-1.5 text-primary-500 disabled:text-gray-300"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-[var(--color-border)] bg-white flex items-center gap-2">
        <Avatar src={user?.avatarUrl} name={user?.displayName || ''} size="sm" />
        <div className="flex-1 flex items-center bg-[var(--color-surface)] rounded-full overflow-hidden">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 text-sm bg-transparent focus:outline-none"
          />
          <button
            onClick={handleComment}
            disabled={!text.trim()}
            className="px-3 py-2 text-primary-500 disabled:text-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
