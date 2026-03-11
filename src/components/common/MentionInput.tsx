import React, { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from './Avatar';
import api from '../../api/client';
import type { User } from '../../types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className = '',
  rows = 1,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get<User[]>('/users').then(setAllUsers).catch(() => {});
  }, []);

  const checkForMention = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    // Check that @ is at start or preceded by whitespace
    if (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1])) {
      setShowSuggestions(false);
      return;
    }

    const query = beforeCursor.slice(atIndex + 1);
    // If there's a space after the query started, close suggestions
    if (/\s/.test(query)) {
      setShowSuggestions(false);
      return;
    }

    setMentionQuery(query);
    setMentionStart(atIndex);
    const q = query.toLowerCase();
    const filtered = allUsers.filter(u =>
      u.displayName.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    ).slice(0, 5);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(0);
  }, [allUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    checkForMention(newValue, e.target.selectionStart || 0);
  };

  const insertMention = (user: User) => {
    const mentionName = user.username || user.displayName.replace(/\s/g, '');
    const before = value.slice(0, mentionStart);
    const after = value.slice((textareaRef.current?.selectionStart || mentionStart + mentionQuery.length + 1));
    const newValue = `${before}@${mentionName} ${after}`;
    onChange(newValue);
    setShowSuggestions(false);

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + mentionName.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />

      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 max-h-48 overflow-y-auto">
          {suggestions.map((user, i) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                i === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="xs" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate">{user.displayName}</p>
                {user.username && (
                  <p className="text-[11px] text-gray-400">@{user.username}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
