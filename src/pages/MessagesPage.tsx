import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ArrowLeft, Search, Image as ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import type { DirectConversation, DirectMessage, User } from '../types';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<Pick<User, 'id' | 'displayName' | 'avatarUrl'>[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<DirectConversation[]>('/messages/conversations');
      setConversations(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    setMsgLoading(true);
    try {
      const data = await api.get<DirectMessage[]>(`/messages/conversations/${convId}/messages`);
      setMessages(data);
      // Update unread count in conversations list
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const interval = setInterval(() => fetchMessages(activeConvId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!newMsg.trim() && !imageFile) || !activeConvId) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (newMsg.trim()) formData.append('content', newMsg.trim());
      if (imageFile) formData.append('image', imageFile);
      const msg = await api.upload<DirectMessage>(`/messages/conversations/${activeConvId}/messages`, formData);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
      setImageFile(null);
      setImagePreview(null);
      // Update last message in conversations list
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c
      ));
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const startNewChat = async (targetUserId: string) => {
    try {
      const { conversationId } = await api.post<{ conversationId: string }>('/messages/conversations', { targetUserId });
      setShowNewChat(false);
      setSearch('');
      await fetchConversations();
      setActiveConvId(conversationId);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  useEffect(() => {
    if (showNewChat && allUsers.length === 0) {
      api.get<any[]>('/users').then(data => {
        setAllUsers(data.filter((u: any) => u.id !== user?.id));
      }).catch(() => {});
    }
  }, [showNewChat, allUsers.length, user?.id]);

  const filteredUsers = allUsers.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  // Mobile: show conversation list or chat, not both
  const showChat = activeConvId !== null;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] overflow-hidden">
      {/* Conversation List */}
      <div className={`${showChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 md:border-r border-gray-100`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center px-4">
              <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-gray-400">No messages yet</p>
              <p className="text-[12px] text-gray-300 mt-1">Start a conversation with a team member</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-xl text-[13px] font-semibold hover:bg-primary-600 transition-colors"
              >
                New Message
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                  activeConvId === conv.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="relative">
                  <Avatar src={conv.otherUser.avatarUrl} name={conv.otherUser.displayName} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[14px] truncate ${conv.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                      {conv.otherUser.displayName}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-[12px] truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}{conv.lastMessage.content || '📷 Photo'}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-col flex-1`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-gray-500" />
              </button>
              <Avatar src={activeConv.otherUser.avatarUrl} name={activeConv.otherUser.displayName} size="sm" />
              <span className="text-[15px] font-bold">{activeConv.otherUser.displayName}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-gray-400">No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Shared"
                            className={`rounded-2xl mb-1 max-h-48 object-cover ${isMine ? 'rounded-tr-md' : 'rounded-tl-md'}`}
                          />
                        )}
                        {msg.content && (
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed ${
                              isMine
                                ? 'bg-primary-500 text-white rounded-tr-md'
                                : 'bg-gray-100 text-gray-800 rounded-tl-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                        )}
                        <p className={`text-[10px] text-gray-400 mt-0.5 ${isMine ? 'text-right' : ''}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  className="px-4 py-2 border-t border-gray-100"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-16 rounded-xl object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                >
                  <ImageIcon className="w-4.5 h-4.5 text-gray-500" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-[14px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!newMsg.trim() && !imageFile)}
                  className="w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-[15px] font-semibold text-gray-400">Select a conversation</p>
              <p className="text-[12px] text-gray-300 mt-1">Choose a chat or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewChat(false)} />
            <motion.div
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-[16px] font-bold">New Message</h3>
                <button onClick={() => setShowNewChat(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search team members..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto px-2 pb-3">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startNewChat(u.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                    <span className="text-[14px] font-medium">{u.displayName}</span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-[13px] text-gray-400 py-4">No members found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;
