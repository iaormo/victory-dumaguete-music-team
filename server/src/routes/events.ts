/**
 * Custom Events Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await prisma.customEvent.findMany({
      orderBy: { date: 'asc' },
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, title } = req.body;
    if (!date || !title?.trim()) {
      res.status(400).json({ error: 'Date and title are required' });
      return;
    }

    const existing = await prisma.customEvent.findUnique({ where: { date } });
    if (existing) {
      res.status(409).json({ error: `An event already exists on ${date}` });
      return;
    }

    const event = await prisma.customEvent.create({
      data: { date, title: title.trim() },
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.customEvent.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
