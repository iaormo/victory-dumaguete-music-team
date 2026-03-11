/**
 * Availability Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    let where: Record<string, unknown> = {};

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = parseInt(month as string) === 12 ? 1 : parseInt(month as string) + 1;
      const endYear = parseInt(month as string) === 12 ? parseInt(year as string) + 1 : parseInt(year as string);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      where = { date: { gte: startDate, lt: endDate } };
    }

    const availabilities = await prisma.availability.findMany({
      where,
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true, roles: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(availabilities);
  } catch (err) {
    console.error('[Availability] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, role, serviceType, isAvailable } = req.body;
    const userId = req.user!.id;

    if (isAvailable) {
      const availability = await prisma.availability.upsert({
        where: {
          userId_date_role_serviceType: {
            userId,
            date,
            role,
            serviceType: serviceType || null,
          },
        },
        update: { isAvailable: true },
        create: { userId, date, role, serviceType: serviceType || null, isAvailable: true },
      });
      res.json(availability);
    } else {
      await prisma.availability.deleteMany({
        where: { userId, date, role, serviceType: serviceType || null },
      });
      res.json({ message: 'Availability removed' });
    }
  } catch (err) {
    console.error('[Availability] Update error:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

router.post('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, date, role, serviceType, isAvailable } = req.body;

    if (isAvailable) {
      const availability = await prisma.availability.upsert({
        where: {
          userId_date_role_serviceType: {
            userId,
            date,
            role,
            serviceType: serviceType || null,
          },
        },
        update: { isAvailable: true },
        create: { userId, date, role, serviceType: serviceType || null, isAvailable: true },
      });
      res.json(availability);
    } else {
      await prisma.availability.deleteMany({
        where: { userId, date, role, serviceType: serviceType || null },
      });
      res.json({ message: 'Availability removed' });
    }
  } catch (err) {
    console.error('[Availability] Admin update error:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

router.get('/date-statuses', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statuses = await prisma.dateStatus.findMany();
    const statusMap: Record<string, string> = {};
    statuses.forEach((s) => {
      statusMap[s.date] = s.status;
    });
    res.json(statusMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch date statuses' });
  }
});

router.put('/date-status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, status } = req.body;

    if (status === null) {
      await prisma.dateStatus.deleteMany({ where: { date } });
      res.json({ message: 'Date status removed' });
    } else {
      await prisma.dateStatus.upsert({
        where: { date },
        update: { status },
        create: { date, status },
      });
      res.json({ message: 'Date status updated' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update date status' });
  }
});

export default router;
