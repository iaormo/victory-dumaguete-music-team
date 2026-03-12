/**
 * Victory Dumaguete Music Team - API Server
 * Express.js Backend with PostgreSQL, Redis, and MinIO
 * @author Ian James Ormo
 * @version 1.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from './config/database.js';
import redis from './config/redis.js';
import { initStorage, getUploadDir } from './config/storage.js';

import { authenticate as authMiddleware, type AuthRequest } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import availabilityRoutes from './routes/availability.js';
import announcementRoutes from './routes/announcements.js';
import eventRoutes from './routes/events.js';
import swapRoutes from './routes/swaps.js';
import uploadRoutes from './routes/upload.js';
import groupRoutes from './routes/groups.js';
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true
    : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/badge-counts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.isAdmin;
    const feedLastRead = req.query.feedLastRead as string | undefined;
    const swapsLastRead = req.query.swapsLastRead as string | undefined;

    const [newPosts, pendingSwaps, unreadNotifications] = await Promise.all([
      feedLastRead
        ? prisma.announcement.count({ where: { createdAt: { gt: new Date(feedLastRead) } } })
        : prisma.announcement.count(),
      // Count incoming pending swaps where user is the target (or all pending for admin)
      isAdmin
        ? prisma.swapRequest.count({ where: { status: 'PENDING' } })
        : prisma.swapRequest.count({ where: { targetUserId: userId, status: 'PENDING' } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({ newPosts, pendingSwaps, unreadNotifications });
  } catch (err) {
    console.error('[BadgeCounts] Error:', err);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

// Handle multer file size errors gracefully
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[Database] PostgreSQL connected');

    try {
      await redis.connect();
    } catch {
      console.warn('[Redis] Could not connect, running without cache');
    }

    await initStorage();
    app.use('/uploads', express.static(getUploadDir()));

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  Victory Dumaguete Music Team API`);
      console.log(`  Author: Ian James Ormo\n`);
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
