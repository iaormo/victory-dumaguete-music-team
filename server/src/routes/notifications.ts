/**
 * Notification Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      include: {
        from: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark single as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;

// Helper: parse @mentions from content and create notifications
export async function createMentionNotifications(
  content: string,
  fromUserId: string,
  link?: string,
): Promise<void> {
  const mentionPattern = /@(\w+)/g;
  const usernames: string[] = [];
  let match;
  while ((match = mentionPattern.exec(content)) !== null) {
    usernames.push(match[1].toLowerCase());
  }

  if (usernames.length === 0) return;

  const mentionedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: { in: usernames, mode: 'insensitive' } },
        { displayName: { in: usernames, mode: 'insensitive' } },
      ],
      id: { not: fromUserId },
    },
    select: { id: true },
  });

  if (mentionedUsers.length === 0) return;

  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { displayName: true },
  });

  await prisma.notification.createMany({
    data: mentionedUsers.map(u => ({
      userId: u.id,
      fromId: fromUserId,
      type: 'mention',
      message: `${fromUser?.displayName || 'Someone'} mentioned you`,
      link: link || '/',
    })),
  });
}
