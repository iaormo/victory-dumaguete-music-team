/**
 * User Management Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.js';
import { cacheDel } from '../config/redis.js';

const router = Router();

router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { displayName: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error('[Users] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, displayName, roles, password } = req.body;

    if (!email || !displayName) {
      res.status(400).json({ error: 'Email and display name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password || 'victory2024', 12);
    const parsedRoles = roles || [];

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName,
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

    res.status(201).json(user);
  } catch (err) {
    console.error('[Users] Create error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/:id/roles', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roles } = req.body;
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: {
        roles,
        isAdmin: roles.includes('ADMIN'),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        isAdmin: true,
      },
    });

    await cacheDel(`user:${String(req.params.id)}`);
    res.json(user);
  } catch (err) {
    console.error('[Users] Role update error:', err);
    res.status(500).json({ error: 'Failed to update roles' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { isActive: false },
    });
    await cacheDel(`user:${String(req.params.id)}`);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export default router;
