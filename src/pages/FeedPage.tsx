import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Lock, Plus, Users, ChevronRight, RefreshCw, X, Check, Globe, Search } from 'lucide-react';
import { Image as ImageIcon, Send, Trash2 } from 'lucide-react';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import Avatar from '../components/common/Avatar';
import MentionInput from '../components/common/MentionInput';
import MentionText from '../components/common/MentionText';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import type { Announcement, Group, GroupMessage, User } from '../types';

type Channel = { type: 'general' } | { type: 'group'; group: Group };

const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel>({ type: 'general' });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupPublic, setGroupPublic] = useState(true);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.get<{ announcements: Announcement[] }>('/announcements');
      setPosts(data.announcements);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await api.get<Group[]>('/groups');
      setGroups(data);
    } catch {}
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await api.get<User[]>('/users');
      setMembers(data);
    } catch {}
  }, []);

  useEffect(() => { fetchPosts(); fetchGroups(); fetchMembers(); }, [fetchPosts, fetchGroups, fetchMembers]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error('Group name required');
    setCreating(true);
    try {
      await api.post('/groups', {
        name: groupName.trim(),
        description: groupDesc.trim() || null,
        isPublic: groupPublic,
        memberIds: groupMembers,
      });
      toast.success('Group created!');
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDesc('');
      setGroupPublic(true);
      setGroupMembers([]);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const toggleGroupMember = (id: string) => {
    setGroupMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const filteredMembers = members.filter(m =>
    m.id !== user?.id &&
    m.displayName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const channelName = channel.type === 'general' ? 'General' : channel.group.name;

  return (
    <div className="space-y-0">
      {/* Channel Header Bar */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] mb-4 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center">
          {/* Channel selector button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-2 px-4 py-3 hover:bg-black/5 transition-colors flex-1 min-w-0"
          >
            {channel.type === 'general' ? (
              <Hash className="w-4.5 h-4.5 text-primary-500 shrink-0" />
            ) : channel.group.isPublic ? (
              <Hash className="w-4.5 h-4.5 text-primary-500 shrink-0" />
            ) : (
              <Lock className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            )}
            <span className="text-[15px] font-bold truncate">{channelName}</span>
            <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${showSidebar ? 'rotate-90' : ''}`} />
          </button>

          {/* Create group button */}
          <motion.button
            onClick={() => setShowCreateGroup(true)}
            className="mr-2 p-2 rounded-lg hover:bg-black/5 transition-colors text-gray-500"
            whileTap={{ scale: 0.9 }}
            title="Create group"
          >
            <Plus className="w-4.5 h-4.5" />
          </motion.button>
        </div>

        {/* Channel List Dropdown */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              className="border-t border-gray-100"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2 max-h-64 overflow-y-auto">
                {/* General Channel */}
                <button
                  onClick={() => { setChannel({ type: 'general' }); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    channel.type === 'general' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Hash className="w-4 h-4 shrink-0" />
                  <span className="text-[14px] font-semibold">General</span>
                  <span className="ml-auto text-[11px] text-gray-400">{posts.length} posts</span>
                </button>

                {groups.length > 0 && (
                  <div className="mt-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Groups</p>
                    {groups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => { setChannel({ type: 'group', group }); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          channel.type === 'group' && channel.group.id === group.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {group.isPublic ? (
                          <Hash className="w-4 h-4 shrink-0 text-gray-400" />
                        ) : (
                          <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                        )}
                        <span className="text-[14px] font-medium truncate">{group.name}</span>
                        <span className="ml-auto text-[11px] text-gray-400">{group.members.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Feed Content */}
      {channel.type === 'general' ? (
        <GeneralFeed posts={posts} loading={loading} onRefresh={fetchPosts} />
      ) : (
        <GroupFeed group={channel.group} onGroupUpdate={fetchGroups} />
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        title="Create Group"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2.5 text-[14px] font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleCreateGroup} disabled={creating} className="px-5 py-2.5 bg-primary-500 text-white text-[14px] font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Group Name</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g. Drummers, Sunday Team"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Description (Optional)</label>
            <input
              value={groupDesc}
              onChange={e => setGroupDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="What's this group about?"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Visibility</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGroupPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  groupPublic ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => setGroupPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  !groupPublic ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Add Members</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search members..."
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleGroupMember(m.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    groupMembers.includes(m.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar src={m.avatarUrl} name={m.displayName} size="xs" />
                  <span className="text-[13px] font-medium truncate">{m.displayName}</span>
                  {groupMembers.includes(m.id) && (
                    <Check className="w-4 h-4 text-primary-500 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* General Feed Sub-component */
const GeneralFeed: React.FC<{
  posts: Announcement[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ posts, loading, onRefresh }) => {
  return (
    <div className="space-y-4">
      <CreatePost onCreated={onRefresh} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="w-28 h-3.5 skeleton" />
                  <div className="w-16 h-3 skeleton" />
                </div>
              </div>
              <div className="w-full h-3.5 skeleton" />
              <div className="w-3/4 h-3.5 skeleton" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 p-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[15px] text-gray-500 font-medium">No announcements yet</p>
          <p className="text-[13px] text-gray-400 mt-1">Team posts will appear here</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PostCard post={post} onUpdate={onRefresh} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Group Feed Sub-component */
const GroupFeed: React.FC<{
  group: Group;
  onGroupUpdate: () => void;
}> = ({ group, onGroupUpdate }) => {
  const { user } = useAuth();
  const isMember = group.members.some(m => m.userId === user?.id) || group.creatorId === user?.id;

  const handleJoin = async () => {
    try {
      await api.post(`/groups/${group.id}/members`, { userId: user?.id });
      toast.success('Joined group!');
      onGroupUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      await api.delete(`/groups/${group.id}/members/${user.id}`);
      toast.success('Left group');
      onGroupUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave');
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Info Card */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {group.isPublic ? (
                <Globe className="w-4 h-4 text-primary-500" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <h2 className="text-[16px] font-bold">{group.name}</h2>
            </div>
            {group.description && (
              <p className="text-[13px] text-gray-500 mt-1">{group.description}</p>
            )}
            <p className="text-[12px] text-gray-400 mt-2">
              Created by {group.creator.displayName} · {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isMember ? (
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              Leave
            </button>
          ) : (
            <motion.button
              onClick={handleJoin}
              className="px-4 py-1.5 bg-primary-500 text-white text-[12px] font-semibold rounded-lg hover:bg-primary-600 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              Join
            </motion.button>
          )}
        </div>

        {/* Members Preview */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
          <Users className="w-3.5 h-3.5 text-gray-400 mr-1" />
          <div className="flex -space-x-2">
            {group.members.slice(0, 6).map(m => (
              <Avatar key={m.id} src={m.user.avatarUrl} name={m.user.displayName} size="xs" className="ring-2 ring-white" />
            ))}
          </div>
          {group.members.length > 6 && (
            <span className="text-[11px] text-gray-400 ml-2">+{group.members.length - 6} more</span>
          )}
        </div>
      </motion.div>

      {/* Group Chat */}
      {isMember ? (
        <GroupChat groupId={group.id} />
      ) : (
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 p-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[15px] text-gray-500 font-medium">Join to see messages</p>
        </motion.div>
      )}
    </div>
  );
};

/* Group Chat Sub-component */
const GroupChat: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<GroupMessage[]>(`/groups/${groupId}/messages`);
      setMessages(data);
    } catch {
      console.error('Failed to fetch messages');
    } finally {
      setLoadingMsgs(false);
    }
  }, [groupId]);

  useEffect(() => {
    setLoadingMsgs(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() && !image) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (image) formData.append('image', image);
      await api.upload(`/groups/${groupId}/messages`, formData);
      setContent('');
      setImage(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await api.delete(`/groups/${groupId}/messages/${msgId}`);
      fetchMessages();
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] overflow-hidden flex flex-col"
      style={{ maxHeight: '60vh' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[13px] text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.authorId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar src={msg.author.avatarUrl} name={msg.author.displayName} size="sm" className="shrink-0 mt-0.5" />
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-semibold text-gray-600">{msg.author.displayName}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`relative rounded-2xl px-3.5 py-2 text-[14px] ${
                    isOwn ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.content && <p className="whitespace-pre-wrap break-words"><MentionText text={msg.content} /></p>}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="mt-1.5 max-w-full max-h-48 rounded-lg object-contain"
                      />
                    )}
                    {(isOwn || user?.isAdmin) && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
            className="px-4 pb-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="relative inline-block">
              <img src={imagePreview} alt="" className="h-16 rounded-lg object-contain bg-gray-100" />
              <button
                onClick={() => { setImage(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-3 flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
        >
          <ImageIcon className="w-[18px] h-[18px]" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
        <MentionInput
          value={content}
          onChange={setContent}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... @name to tag"
          className="flex-1 bg-gray-100 rounded-xl px-3.5 py-2 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all max-h-24"
          rows={1}
        />
        <motion.button
          onClick={handleSend}
          disabled={(!content.trim() && !image) || sending}
          className="w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FeedPage;
