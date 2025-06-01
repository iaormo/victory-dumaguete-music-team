import React, { useState } from 'react';
import { Announcement, User } from '../types';
import EmojiReactions from './EmojiReactions';
import CommentSection from './CommentSection';

interface AnnouncementBoardProps {
  announcements: Announcement[];
  currentUser: User;
  onAddComment: (announcementId: string, content: string) => void;
  onAddReply: (announcementId: string, commentId: string, content: string) => void;
  onReactToAnnouncement: (announcementId: string, emoji: string) => void;
  onReactToComment: (announcementId: string, commentId: string, emoji: string) => void;
  onReactToReply: (announcementId: string, commentId: string, replyId: string, emoji: string) => void;
}

const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({
  announcements,
  currentUser,
  onAddComment,
  onAddReply,
  onReactToAnnouncement,
  onReactToComment,
  onReactToReply
}) => {
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const sortedAnnouncements = [...announcements].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const toggleAnnouncement = (id: string) => {
    setExpandedAnnouncement(expandedAnnouncement === id ? null : id);
  };

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sortedAnnouncements.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-lg">No announcements yet.</p>
        <p className="text-sm">Check back later for updates!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[30rem] overflow-y-auto custom-scrollbar p-1 pr-2">
      {sortedAnnouncements.map(announcement => (
        <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-150 border border-gray-200 overflow-hidden">
          <div 
            className="p-4 cursor-pointer"
            onClick={() => toggleAnnouncement(announcement.id)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {announcement.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium">{announcement.authorName}</h4>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(announcement.timestamp)}
                  </span>
                </div>
                <p className="text-gray-800 mt-1 whitespace-pre-wrap break-words">
                  {announcement.content}
                </p>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <EmojiReactions
                      reactions={announcement.reactions || []}
                      currentUserId={currentUser.id}
                      onReaction={(emoji) => onReactToAnnouncement(announcement.id, emoji)}
                    />
                  </div>
                  <button 
                    className="text-sm text-gray-500 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAnnouncement(announcement.id);
                    }}
                  >
                    {announcement.comments?.length || 0} comments
                  </button>
                </div>
              </div>
            </div>
          </div>

          {expandedAnnouncement === announcement.id && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <CommentSection
                comments={announcement.comments || []}
                currentUser={currentUser}
                onAddComment={(content) => onAddComment(announcement.id, content)}
                onAddReply={(commentId, content) => onAddReply(announcement.id, commentId, content)}
                onReaction={(commentId, emoji) => onReactToComment(announcement.id, commentId, emoji)}
                onReplyReaction={(commentId, replyId, emoji) => onReactToReply(announcement.id, commentId, replyId, emoji)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBoard;
