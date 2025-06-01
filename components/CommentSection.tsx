import React, { useState } from 'react';
import { Comment, User } from '../types';
import EmojiReactions from './EmojiReactions';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string) => void;
  onAddReply: (commentId: string, content: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  onReplyReaction: (commentId: string, replyId: string, emoji: string) => void;
}

interface CommentProps {
  comment: Comment;
  currentUser: User;
  onAddReply: (commentId: string, content: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  onReplyReaction: (commentId: string, replyId: string, emoji: string) => void;
}

const CommentItem: React.FC<CommentProps> = ({ 
  comment, 
  currentUser, 
  onAddReply, 
  onReaction,
  onReplyReaction 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = () => {
    if (replyContent.trim()) {
      onAddReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-200">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="ml-2 flex-1">
          <div className="bg-gray-100 rounded-lg p-2">
            <div className="flex justify-between items-start">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
            
            <div className="mt-1">
              <EmojiReactions
                reactions={comment.reactions || []}
                currentUserId={currentUser.id}
                onReaction={(emoji) => onReaction(comment.id, emoji)}
              />
            </div>
          </div>
          
          <div className="flex space-x-3 text-xs text-gray-500 mt-1">
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="hover:text-blue-500"
            >
              Reply
            </button>
            {comment.replies?.length > 0 && (
              <button 
                onClick={() => setShowReplies(!showReplies)}
                className="hover:text-blue-500"
              >
                {showReplies ? 'Hide replies' : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-2 flex">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 text-sm border rounded-l-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
              />
              <button
                onClick={handleReply}
                className="bg-blue-500 text-white px-3 rounded-r-lg hover:bg-blue-600 text-sm"
              >
                Post
              </button>
            </div>
          )}

          {showReplies && comment.replies?.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start mt-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs">
                    {reply.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2 flex-1">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs">{reply.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{reply.content}</p>
                      <div className="mt-1">
                        <EmojiReactions
                          reactions={reply.reactions || []}
                          currentUserId={currentUser.id}
                          onReaction={(emoji) => onReplyReaction(comment.id, reply.id, emoji)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  currentUser,
  onAddComment,
  onAddReply,
  onReaction,
  onReplyReaction
}) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="ml-2 flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={handleAddComment}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
              disabled={!newComment.trim()}
            >
              Comment
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
            onAddReply={onAddReply}
            onReaction={onReaction}
            onReplyReaction={onReplyReaction}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
