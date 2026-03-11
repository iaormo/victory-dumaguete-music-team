/**
 * Authentication Middleware
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import redis, { cacheGet, cacheSet } from '../config/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vdmt-dev-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string | null;
    displayName: string;
    isAdmin: boolean;
    roles: string[];
    avatarUrl: string | null;
    birthday: string | null;
    phone: string | null;
    address: string | null;
  };
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const cacheKey = `user:${decoded.userId}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      req.user = JSON.parse(cached);
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        roles: true,
        avatarUrl: true,
        birthday: true,
        phone: true,
        address: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    await cacheSet(cacheKey, JSON.stringify(user), 600);

    next();
  } catch (err) {
    console.error('[Auth] Middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
