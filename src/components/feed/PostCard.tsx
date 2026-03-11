import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, ThumbsUp, Laugh, Frown, Angry, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import MentionText from '../common/MentionText';
import CommentSection from './CommentSection';
import type { Announcement, Reaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const REACTION_EMOJIS = [
  { emoji: '\u{1F44D}', label: 'Like' },
  { emoji: '\u{2764}\u{FE0F}', label: 'Love' },
  { emoji: '\u{1F602}', label: 'Haha' },
  { emoji: '\u{1F62E}', label: 'Wow' },
  { emoji: '\u{1F622}', label: 'Sad' },
  { emoji: '\u{1F621}', label: 'Angry' },
];

interface PostCardProps {
  post: Announcement;
  onUpdate: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = user?.isAdmin || user?.id === post.authorId;

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${post.id}`);
      onUpdate();
    } catch {
      setDeleting(false);
    }
  };

  const myReaction = post.reactions.find(r => r.authorId === user?.id);
  const reactionGroups = post.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const handleReact = async (emoji: string, label: string) => {
    setShowReactions(false);
    try {
      await api.post('/announcements/react', { emoji, label, announcementId: post.id });
      onUpdate();
    } catch {}
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-[var(--color-text-primary)] leading-tight">{post.author.displayName}</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5" title={format(new Date(post.createdAt), 'PPpp')}>{timeAgo}</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full hover:bg-[var(--color-surface)] flex items-center justify-center transition-colors shrink-0">
              <MoreHorizontal className="w-[18px] h-[18px] text-[var(--color-text-muted)]" />
            </button>
            {showMenu && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[var(--color-border)] z-20 py-1 min-w-[140px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onMouseLeave={() => setShowMenu(false)}
              >
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                )}
                {!canDelete && (
                  <div className="px-4 py-2.5 text-[13px] text-[var(--color-text-muted)]">No actions</div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <p className="mt-3 text-[15px] text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
          <MentionText text={post.content} />
        </p>

        {post.imageUrl && (
          <div className="mt-3 -mx-4 bg-gray-100">
            <img src={post.imageUrl} alt="" className="w-full max-h-[500px] object-contain" loading="lazy" />
          </div>
        )}
      </div>

      {(Object.keys(reactionGroups).length > 0 || post.comments.length > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-[12px] text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1">
            {Object.entries(reactionGroups).slice(0, 3).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span className="text-[14px]">{emoji}</span>
                {count > 1 && <span>{count}</span>}
              </span>
            ))}
            {post.reactions.length > 0 && (
              <span className="ml-1 text-[var(--color-text-muted)]">{post.reactions.length}</span>
            )}
          </div>
          {post.comments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline text-[var(--color-text-muted)]">
              {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] px-2 py-1">
        <div className="flex items-center">
          <div className="relative flex-1">
            <button
              onClick={() => myReaction ? handleReact(myReaction.emoji, myReaction.label) : setShowReactions(!showReactions)}
              onMouseEnter={() => setShowReactions(true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[14px] font-medium ${
                myReaction ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {myReaction ? (
                <span className="text-[18px] leading-none">{myReaction.emoji}</span>
              ) : (
                <ThumbsUp className="w-[18px] h-[18px]" />
              )}
              <span>{myReaction ? myReaction.label : 'Like'}</span>
            </button>

            {showReactions && (
              <motion.div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 bg-white rounded-full shadow-lg px-3 py-2 border border-[var(--color-border)] z-10"
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                onMouseLeave={() => setShowReactions(false)}
              >
                {REACTION_EMOJIS.map(({ emoji, label }) => (
                  <motion.button
                    key={emoji}
                    onClick={() => handleReact(emoji, label)}
                    className="text-[24px] hover:scale-125 transition-transform p-1"
                    whileHover={{ scale: 1.3, y: -4 }}
                    title={label}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[14px] font-medium text-[var(--color-text-secondary)]"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>Comment</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[14px] font-medium text-[var(--color-text-secondary)]">
            <Share2 className="w-[18px] h-[18px]" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {showComments && (
        <CommentSection
          announcementId={post.id}
          comments={post.comments}
          onUpdate={onUpdate}
        />
      )}
    </motion.div>
  );
};

export default PostCard;
