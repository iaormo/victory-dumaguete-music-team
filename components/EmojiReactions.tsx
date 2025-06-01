import React, { useState } from 'react';
import { Reaction } from '../types';

const EMOJIS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

interface EmojiReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onReaction: (emoji: string) => void;
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
  reactions, 
  currentUserId, 
  onReaction 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const userReaction = reactions.find(r => r.authorId === currentUserId);
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative">
      <div className="flex items-center space-x-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => onReaction(emoji)}
            className={`text-lg hover:scale-110 transition-transform ${
              userReaction?.emoji === emoji ? 'scale-110' : ''
            }`}
            title={reactions.find(r => r.emoji === emoji)?.label}
          >
            {emoji} {count > 1 && <span className="text-xs">{count}</span>}
          </button>
        ))}
        
        <button 
          onClick={() => setShowPicker(!showPicker)}
          className="text-gray-500 hover:text-blue-500 text-sm ml-1"
        >
          {userReaction ? 'Change' : 'React'}
        </button>
      </div>

      {showPicker && (
        <div className="absolute bottom-full left-0 bg-white shadow-lg rounded-full px-2 py-1 flex space-x-1 z-10">
          {EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => {
                onReaction(emoji);
                setShowPicker(false);
              }}
              className="text-2xl hover:scale-125 transform transition-transform"
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiReactions;
