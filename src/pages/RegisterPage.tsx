import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Camera, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, ROLE_LABELS, ALL_ROLES } from '../types';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: UserRole) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) return toast.error('Please fill in all required fields');
    if (roles.length === 0) return toast.error('Select at least one role');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('roles', JSON.stringify(roles));
      if (avatar) formData.append('avatar', avatar);

      await register(formData);
      toast.success('Account created!');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex flex-col items-center justify-center p-6 py-10">
      <motion.div
        className="w-full max-w-[380px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold text-white leading-tight">Join the Team</h1>
          <p className="text-white/70 text-[14px] mt-1">Victory Music Team Dumaguete</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-heavy rounded-2xl shadow-[var(--shadow-glass)] border border-white/40 p-7 space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-center">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
              <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center ring-2 ring-white">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2.5 uppercase tracking-wider">Your Roles</label>
            <div className="grid grid-cols-2 gap-2.5">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                    roles.includes(role)
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    roles.includes(role) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                  }`}>
                    {roles.includes(role) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{ROLE_LABELS[role]}</span>
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <p className="text-center text-[14px] text-[var(--color-text-secondary)] pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">Sign In</Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
