import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mail, Shield, Save, Lock, Eye, EyeOff, User as UserIcon, AtSign, Cake, Phone, MapPin, ImagePlus } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import api from '../api/client';
import toast from 'react-hot-toast';

const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
};

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const wallpaperRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [birthday, setBirthday] = useState(user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [preview, setPreview] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [wallpaper, setWallpaper] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleWallpaper = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 0.7);
        setWallpaper(compressed);
        setWallpaperPreview(URL.createObjectURL(compressed));
        toast.success(`Wallpaper compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
      } catch {
        setWallpaper(file);
        setWallpaperPreview(URL.createObjectURL(file));
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (displayName !== user?.displayName) formData.append('displayName', displayName);
      if (username !== (user?.username || '')) formData.append('username', username);
      const origBirthday = user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '';
      if (birthday !== origBirthday) formData.append('birthday', birthday);
      if (phone !== (user?.phone || '')) formData.append('phone', phone);
      if (address !== (user?.address || '')) formData.append('address', address);
      if (avatar) formData.append('avatar', avatar);
      if (wallpaper) formData.append('wallpaper', wallpaper);
      const result = await updateProfile(formData);
      if (result?.warning) {
        toast(result.warning, { icon: '\u26a0\ufe0f' });
      } else {
        toast.success('Profile updated!');
      }
      setAvatar(null);
      setWallpaper(null);
      setWallpaperPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return toast.error('Fill in all password fields');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    setChangingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Password updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  const origBirthday = user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '';
  const hasChanges = displayName !== user.displayName || username !== (user.username || '') || birthday !== origBirthday || phone !== (user.phone || '') || address !== (user.address || '') || avatar !== null || wallpaper !== null;

  return (
    <div className="space-y-4">
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="h-32 relative overflow-hidden group/wall cursor-pointer" onClick={() => wallpaperRef.current?.click()}>
          {(wallpaperPreview || user.wallpaperUrl) ? (
            <img src={wallpaperPreview || user.wallpaperUrl!} alt="Wallpaper" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-500 to-primary-700" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover/wall:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover/wall:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-[12px] font-semibold bg-black/50 px-3 py-1.5 rounded-full">
              <ImagePlus className="w-3.5 h-3.5" />
              Change Wallpaper
            </div>
          </div>
          <input ref={wallpaperRef} type="file" accept="image/*" onChange={handleWallpaper} className="hidden" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex justify-center -mt-14">
            <button onClick={() => fileRef.current?.click()} className="relative group">
              <Avatar src={preview || user.avatarUrl} name={user.displayName} size="xl" className="ring-4 ring-white" />
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </div>

          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-[20px] font-bold">{user.displayName}</h1>
              {user.isAdmin && <Shield className="w-5 h-5 text-primary-500" />}
            </div>
            {user.username && (
              <p className="text-[13px] text-primary-500 font-medium">@{user.username}</p>
            )}
            <p className="text-[14px] text-[var(--color-text-secondary)]">{user.email}</p>

            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {user.roles.filter(r => r !== UserRole.ADMIN).map(r => (
                <Badge key={r} role={r} size="md" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2.5">
          <UserIcon className="w-4 h-4 text-primary-500" />
          Edit Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Choose a username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Email</label>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-100 text-[15px] text-[var(--color-text-muted)]">
              <Mail className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Birthday</label>
            <div className="relative">
              <Cake className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your address"
              />
            </div>
          </div>

          {hasChanges && (
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Password Change Section */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[var(--shadow-card)] p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-primary-500" />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <motion.button
            onClick={handlePasswordChange}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {changingPassword ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Update Password
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
