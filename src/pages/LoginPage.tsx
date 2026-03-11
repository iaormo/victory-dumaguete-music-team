import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(identifier, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-[380px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-bold text-white leading-tight">Victory Music Team Dumaguete</h1>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-heavy rounded-2xl shadow-[var(--shadow-glass)] border border-white/40 p-7 space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Username or email"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-liquid-glass text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <p className="text-center text-[14px] text-[var(--color-text-secondary)] pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
