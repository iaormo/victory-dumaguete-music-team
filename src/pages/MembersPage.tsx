import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Shield, Edit3, Check, X, LogIn, Cake, Phone, MapPin, KeyRound, Mail, ChevronDown } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { UserRole, ROLE_LABELS, ALL_MANAGEABLE_ROLES, type User } from '../types';

const MembersPage: React.FC = () => {
  const { user: currentUser, impersonate } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [editBirthday, setEditBirthday] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await api.get<User[]>('/users');
      setMembers(data);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filteredMembers = members.filter(m =>
    m.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!newName || !newEmail) return toast.error('Name and email required');
    try {
      await api.post('/users', { displayName: newName, email: newEmail, roles: newRoles, password: 'victory2024' });
      toast.success('Member added!');
      setShowAddModal(false);
      setNewName(''); setNewEmail(''); setNewRoles([]);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      await api.put(`/users/${editingUser.id}/roles`, { roles: editRoles });
      await api.put(`/users/${editingUser.id}`, {
        displayName: editDisplayName || undefined,
        birthday: editBirthday || null,
        phone: editPhone || null,
        address: editAddress || null,
      });
      toast.success('Member updated!');
      setEditingUser(null);
      fetchMembers();
    } catch {
      toast.error('Failed to update member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    setResettingPassword(true);
    try {
      await api.put(`/users/${editingUser.id}/reset-password`, {});
      toast.success('Password reset to default (victory2024)');
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      await impersonate(userId);
      toast.success('Now viewing as this user');
    } catch (err: any) {
      toast.error(err.message || 'Failed to login as user');
    }
  };

  const toggleNewRole = (role: UserRole) => setNewRoles(p => p.includes(role) ? p.filter(r => r !== role) : [...p, role]);
  const toggleEditRole = (role: UserRole) => setEditRoles(p => p.includes(role) ? p.filter(r => r !== role) : [...p, role]);

  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-primary-500" />
            <h1 className="text-[17px] font-bold">Team Members</h1>
            <span className="px-2 py-0.5 bg-[var(--color-surface)] rounded-full text-[12px] font-semibold text-[var(--color-text-secondary)]">
              {members.length}
            </span>
          </div>
          {currentUser?.isAdmin && (
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-semibold hover:bg-primary-600 transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </motion.button>
          )}
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-11 pr-4 py-3 bg-[var(--color-surface)] rounded-xl text-[15px] focus:ring-2 focus:ring-primary-500 border border-transparent focus:border-transparent transition-all"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="w-28 h-3.5 skeleton" />
                  <div className="w-20 h-3 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-[14px] text-[var(--color-text-muted)] py-8">No members found</p>
        ) : (
          <div className="space-y-1">
            {filteredMembers.map((member, i) => (
              <motion.div
                key={member.id}
                className="rounded-xl hover:bg-[var(--color-surface)] transition-colors group"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                >
                  <Avatar src={member.avatarUrl} name={member.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold truncate">{member.displayName}</p>
                      {member.isAdmin && <Shield className="w-3.5 h-3.5 text-primary-500 shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {member.roles.filter(r => r !== UserRole.ADMIN).map(r => (
                        <Badge key={r} role={r} size="sm" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {currentUser?.isAdmin && (
                      <>
                        {member.id !== currentUser.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImpersonate(member.id); }}
                            className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full hover:bg-blue-100 flex items-center justify-center transition-all"
                            title="Login as this user"
                          >
                            <LogIn className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUser(member);
                            setEditRoles([...member.roles]);
                            setEditDisplayName(member.displayName);
                            setEditBirthday(member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '');
                            setEditPhone(member.phone || '');
                            setEditAddress(member.address || '');
                          }}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                        </button>
                      </>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMember === member.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedMember === member.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 ml-[52px] space-y-1.5">
                        <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <a href={`tel:${member.phone}`} className="text-primary-500 hover:underline">{member.phone}</a>
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{member.address}</span>
                          </div>
                        )}
                        {member.birthday && (
                          <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                            <Cake className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(member.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                        {!member.phone && !member.address && !member.birthday && (
                          <p className="text-[12px] text-gray-400 italic">No additional info available</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Team Member" footer={
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAddUser} className="px-5 py-2.5 bg-primary-500 text-white text-[14px] font-semibold rounded-lg hover:bg-primary-600 transition-colors">Add Member</button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Email</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2.5 uppercase tracking-wider">Roles</label>
            <div className="grid grid-cols-2 gap-2.5">
              {ALL_MANAGEABLE_ROLES.map(role => (
                <button key={role} type="button" onClick={() => toggleNewRole(role)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${newRoles.includes(role) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${newRoles.includes(role) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                    {newRoles.includes(role) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{ROLE_LABELS[role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit Member - ${editingUser?.displayName}`} footer={
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditingUser(null)} className="px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} disabled={savingEdit} className="px-5 py-2.5 bg-primary-500 text-white text-[14px] font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">
            {savingEdit ? 'Saving...' : 'Save'}
          </button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Display Name</label>
            <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Birthday</label>
            <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Phone Number</label>
            <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Enter phone number" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Address</label>
            <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Enter address" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2.5 uppercase tracking-wider">Roles</label>
            <div className="grid grid-cols-2 gap-2.5">
              {ALL_MANAGEABLE_ROLES.map(role => (
                <button key={role} type="button" onClick={() => toggleEditRole(role)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${editRoles.includes(role) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${editRoles.includes(role) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                    {editRoles.includes(role) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{ROLE_LABELS[role]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Password Reset */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[13px] font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {resettingPassword ? 'Resetting...' : 'Reset Password to Default'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MembersPage;
