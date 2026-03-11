/**
 * Authentication Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { cacheDel } from '../config/redis.js';
import { AuthRequest, authenticate, generateToken } from '../middleware/auth.js';
import { uploadFile } from '../config/minio.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/register', upload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, displayName, roles } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    let avatarUrl: string | null = null;
    if (req.file) {
      avatarUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const parsedRoles = roles ? (typeof roles === 'string' ? JSON.parse(roles) : roles) : [];

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName,
        avatarUrl,
        roles: parsedRoles,
        isAdmin: parsedRoles.includes('ADMIN'),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        isAdmin: true,
        createdAt: true,
      },
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
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
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

    const { displayName } = req.body;
    const updateData: Record<string, unknown> = {};

    if (displayName) updateData.displayName = displayName;

    if (req.file) {
      const avatarUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
      updateData.avatarUrl = avatarUrl;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        isAdmin: true,
      },
    });

    await cacheDel(`user:${req.user.id}`);
    res.json({ user });
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

export default router;
