/**
 * Authentication Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { cacheDel } from '../config/redis.js';
import { AuthRequest, authenticate, generateToken, requireAdmin } from '../middleware/auth.js';
import { uploadFile } from '../config/storage.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  birthday: true,
  phone: true,
  address: true,
  roles: true,
  isAdmin: true,
  createdAt: true,
};

const validateUsername = (username: string): string | null => {
  if (username.length < 3 || username.length > 20) return 'Username must be 3-20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
};

router.post('/register', upload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, displayName, roles, username } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    let cleanUsername: string | null = null;
    if (username && username.trim()) {
      cleanUsername = username.trim().toLowerCase();
      const usernameError = validateUsername(cleanUsername);
      if (usernameError) {
        res.status(400).json({ error: usernameError });
        return;
      }
      const existingUsername = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existingUsername) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
    }

    let avatarUrl: string | null = null;
    if (req.file) {
      try {
        avatarUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
      } catch (uploadErr) {
        console.error('[Auth] Avatar upload failed (MinIO may be down):', uploadErr);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const parsedRoles = roles ? (typeof roles === 'string' ? JSON.parse(roles) : roles) : [];

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: cleanUsername,
        password: hashedPassword,
        displayName,
        avatarUrl,
        roles: parsedRoles,
        isAdmin: parsedRoles.includes('ADMIN'),
      },
      select: USER_SELECT,
    });

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email;

    if (!loginId || !password) {
      res.status(400).json({ error: 'Username/email and password are required' });
      return;
    }

    const normalized = loginId.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalized },
          { username: normalized },
        ],
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await cacheDel(`user:${req.user.id}`);
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

router.put('/profile', authenticate, upload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { displayName, username, birthday, phone, address } = req.body;
    const updateData: Record<string, unknown> = {};
    let warning: string | undefined;

    if (displayName) updateData.displayName = displayName;
    if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;

    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername === '') {
        updateData.username = null;
      } else {
        const usernameError = validateUsername(cleanUsername);
        if (usernameError) {
          res.status(400).json({ error: usernameError });
          return;
        }
        const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (existing && existing.id !== req.user.id) {
          res.status(409).json({ error: 'Username already taken' });
          return;
        }
        updateData.username = cleanUsername;
      }
    }

    if (req.file) {
      try {
        const avatarUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
        updateData.avatarUrl = avatarUrl;
      } catch (uploadErr) {
        console.error('[Auth] Avatar upload failed (MinIO may be down):', uploadErr);
        warning = 'Photo upload failed (storage unavailable), but other changes were saved.';
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: USER_SELECT,
    });

    await cacheDel(`user:${req.user.id}`);
    res.json({ user, warning });
  } catch (err) {
    console.error('[Auth] Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!dbUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await cacheDel(`user:${req.user.id}`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth] Password change error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

router.post('/impersonate/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.userId as string;

    if (targetUserId === req.user?.id) {
      res.status(400).json({ error: 'Cannot impersonate yourself' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId, isActive: true },
      select: USER_SELECT,
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = generateToken(targetUser.id);
    res.json({ user: targetUser, token, impersonating: true });
  } catch (err) {
    console.error('[Auth] Impersonate error:', err);
    res.status(500).json({ error: 'Impersonation failed' });
  }
});

export default router;
