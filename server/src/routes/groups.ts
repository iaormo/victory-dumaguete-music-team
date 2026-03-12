/**
 * Groups Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../config/storage.js';
import { createMentionNotifications } from './notifications.js';

const router = Router();

const groupInclude = {
  creator: { select: { id: true, displayName: true, avatarUrl: true } },
  members: {
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, roles: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { isPublic: true },
          { creatorId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: groupInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (err) {
    console.error('[Groups] List error:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic, memberIds } = req.body;
    const userId = req.user!.id;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Group name is required' });
      return;
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic !== false,
        creatorId: userId,
        members: {
          create: [
            { userId },
            ...(memberIds || []).filter((id: string) => id !== userId).map((id: string) => ({ userId: id })),
          ],
        },
      },
      include: groupInclude,
    });

    res.status(201).json(group);
  } catch (err) {
    console.error('[Groups] Create error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { name, description, isPublic } = req.body;

    const existing = await prisma.group.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (existing.creatorId !== userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Only the group creator or admin can edit' });
      return;
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
      include: groupInclude,
    });

    res.json(group);
  } catch (err) {
    console.error('[Groups] Update error:', err);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.group.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    if (existing.creatorId !== userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Only the group creator or admin can delete' });
      return;
    }

    await prisma.group.delete({ where: { id } });
    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('[Groups] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

router.post('/:id/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (group.creatorId !== requesterId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Only the group creator or admin can add members' });
      return;
    }

    await prisma.groupMember.create({
      data: { groupId: id, userId: targetUserId },
    });

    const updated = await prisma.group.findUnique({ where: { id }, include: groupInclude });
    res.json(updated);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'User is already a member' });
      return;
    }
    console.error('[Groups] Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const requesterId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isSelf = requesterId === targetUserId;
    const isCreator = group.creatorId === requesterId;
    if (!isSelf && !isCreator && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Not authorized to remove this member' });
      return;
    }

    await prisma.groupMember.deleteMany({
      where: { groupId: id, userId: targetUserId },
    });

    const updated = await prisma.group.findUnique({ where: { id }, include: groupInclude });
    res.json(updated);
  } catch (err) {
    console.error('[Groups] Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Group Messages
router.get('/:id/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await prisma.groupMessage.findMany({
      where: { groupId: id },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error('[Groups] Messages fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', authenticate, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content?.trim() && !req.file) {
      res.status(400).json({ error: 'Message content or image required' });
      return;
    }

    // Check membership
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!isMember && !req.user!.isAdmin) {
      res.status(403).json({ error: 'You must be a member to post' });
      return;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      try {
        imageUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
      } catch (uploadErr) {
        console.error('[Groups] Image upload failed:', uploadErr);
      }
    }

    const message = await prisma.groupMessage.create({
      data: {
        content: content?.trim() || '',
        imageUrl,
        authorId: userId,
        groupId: id,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (content?.trim()) {
      createMentionNotifications(content.trim(), userId, '/').catch(() => {});
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('[Groups] Message create error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.delete('/:id/messages/:messageId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const msg = await prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    if (msg.authorId !== req.user!.id && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.groupMessage.delete({ where: { id: messageId } });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('[Groups] Message delete error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
