/**
 * Swap Request Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { createMentionNotifications } from './notifications.js';

const router = Router();

const swapIncludes = {
  requestingUser: {
    select: { id: true, displayName: true, avatarUrl: true, roles: true },
  },
  targetUser: {
    select: { id: true, displayName: true, avatarUrl: true, roles: true },
  },
};

// Get swaps relevant to current user (sent + incoming)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.isAdmin;

    const swaps = await prisma.swapRequest.findMany({
      where: isAdmin ? {} : {
        OR: [
          { requestingUserId: userId },
          { targetUserId: userId },
        ],
      },
      include: swapIncludes,
      orderBy: { createdAt: 'desc' },
    });
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch swap requests' });
  }
});

// Create swap request — requester picks a target member with same role
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, role, serviceType, reason, originalAvailabilityId, targetUserId } = req.body;

    if (!reason?.trim()) {
      res.status(400).json({ error: 'Reason is required' });
      return;
    }
    if (!targetUserId) {
      res.status(400).json({ error: 'Please select a replacement member' });
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
        targetUserId,
        date,
        role,
        serviceType: serviceType || null,
        reason: reason.trim(),
        originalAvailabilityId,
      },
      include: swapIncludes,
    });

    // Create notification for the target user
    const fromUser = req.user!;
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        fromId: fromUser.id,
        type: 'swap_request',
        message: `${fromUser.displayName} wants to swap with you`,
        link: '/swaps',
      },
    }).catch(() => {});

    res.status(201).json(swap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});

// Target user accepts or rejects the swap
router.put('/:id/respond', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body; // APPROVED or REJECTED
    const userId = req.user!.id;

    const swap = await prisma.swapRequest.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!swap) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    // Only the target user can respond (or admin)
    if (swap.targetUserId !== userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Only the swap target can respond' });
      return;
    }

    if (swap.status !== 'PENDING') {
      res.status(400).json({ error: 'This swap has already been resolved' });
      return;
    }

    const updated = await prisma.swapRequest.update({
      where: { id: swap.id },
      data: {
        status,
        resolvedAt: new Date(),
      },
      include: swapIncludes,
    });

    // If accepted, swap the availability records
    if (status === 'APPROVED') {
      const parts = swap.originalAvailabilityId.split('::');
      if (parts.length === 4) {
        // Remove requester's availability
        await prisma.availability.deleteMany({
          where: {
            userId: parts[0],
            date: parts[1],
            role: parts[2] as any,
            serviceType: parts[3] === 'default' ? null : parts[3] as any,
          },
        });

        // Add target user's availability for that slot
        if (swap.targetUserId) {
          await prisma.availability.upsert({
            where: {
              userId_date_role_serviceType: {
                userId: swap.targetUserId,
                date: parts[1],
                role: parts[2] as any,
                serviceType: parts[3] === 'default' ? null : (parts[3] as any),
              },
            },
            update: { isAvailable: true },
            create: {
              userId: swap.targetUserId,
              date: parts[1],
              role: parts[2] as any,
              serviceType: parts[3] === 'default' ? null : (parts[3] as any),
              isAvailable: true,
            },
          });
        }
      }
    }

    // Notify requester of the response
    await prisma.notification.create({
      data: {
        userId: swap.requestingUserId,
        fromId: userId,
        type: status === 'APPROVED' ? 'swap_approved' : 'swap_rejected',
        message: `${req.user!.displayName} ${status === 'APPROVED' ? 'accepted' : 'declined'} your swap request`,
        link: '/swaps',
      },
    }).catch(() => {});

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond to swap request' });
  }
});

export default router;
