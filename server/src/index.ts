/**
 * Victory Dumaguete Music Team - API Server
 * Express.js Backend with PostgreSQL, Redis, and MinIO
 * @author Ian James Ormo
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from './config/database.js';
import redis from './config/redis.js';
import { initMinIO } from './config/minio.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import availabilityRoutes from './routes/availability.js';
import announcementRoutes from './routes/announcements.js';
import eventRoutes from './routes/events.js';
import swapRoutes from './routes/swaps.js';
import uploadRoutes from './routes/upload.js';
import groupRoutes from './routes/groups.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../../dist');
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

    try {
      await initMinIO();
    } catch {
      console.warn('[MinIO] Could not initialize, file uploads may not work');
    }

    app.listen(PORT, () => {
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
