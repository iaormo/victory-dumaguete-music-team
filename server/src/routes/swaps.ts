/**
 * Swap Request Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const swaps = await prisma.swapRequest.findMany({
      include: {
        requestingUser: {
          select: { id: true, displayName: true, avatarUrl: true, roles: true },
        },
        resolvedByAdmin: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch swap requests' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, role, serviceType, reason, originalAvailabilityId } = req.body;

    if (!reason?.trim()) {
      res.status(400).json({ error: 'Reason is required' });
      return;
    }

    const existingPending = await prisma.swapRequest.findFirst({
      where: {
        requestingUserId: req.user!.id,
        originalAvailabilityId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      res.status(409).json({ error: 'You already have a pending swap request for this slot' });
      return;
    }

    const swap = await prisma.swapRequest.create({
      data: {
        requestingUserId: req.user!.id,
        date,
        role,
        serviceType: serviceType || null,
        reason: reason.trim(),
        originalAvailabilityId,
      },
      include: {
        requestingUser: {
          select: { id: true, displayName: true, avatarUrl: true, roles: true },
        },
      },
    });

    res.status(201).json(swap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});

router.put('/:id/resolve', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, adminNotes, replacementUserId } = req.body;

    const swap = await prisma.swapRequest.update({
      where: { id: String(req.params.id) },
      data: {
        status,
        adminNotes: adminNotes?.trim() || null,
        resolvedAt: new Date(),
        resolvedByAdminId: req.user!.id,
      },
      include: {
        requestingUser: {
          select: { id: true, displayName: true, roles: true },
        },
      },
    });

    if (status === 'APPROVED') {
      const parts = swap.originalAvailabilityId.split('::');
      if (parts.length === 4) {
        await prisma.availability.deleteMany({
          where: {
            userId: parts[0],
            date: parts[1],
            role: parts[2] as any,
            serviceType: parts[3] === 'default' ? null : parts[3] as any,
          },
        });

        if (replacementUserId) {
          await prisma.availability.create({
            data: {
              userId: replacementUserId,
              date: parts[1],
              role: parts[2] as any,
              serviceType: parts[3] === 'default' ? null : parts[3] as any,
              isAvailable: true,
            },
          });
        }
      }
    }

    res.json(swap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve swap request' });
  }
});

export default router;
