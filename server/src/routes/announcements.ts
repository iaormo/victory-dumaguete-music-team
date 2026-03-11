/**
 * Announcements Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../config/minio.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const announcements = await prisma.announcement.findMany({
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: {
          include: {
            author: { select: { id: true, displayName: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
            reactions: {
              include: { author: { select: { id: true, displayName: true } } },
            },
            replies: {
              include: {
                author: { select: { id: true, displayName: true, avatarUrl: true } },
                reactions: {
                  include: { author: { select: { id: true, displayName: true } } },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.announcement.count();
    res.json({ announcements, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Announcements] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', authenticate, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
    }

    const announcement = await prisma.announcement.create({
      data: {
        content: content.trim(),
        authorId: req.user!.id,
        imageUrl,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: true,
        comments: true,
      },
    });

    res.status(201).json(announcement);
  } catch (err) {
    console.error('[Announcements] Create error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: req.user!.id,
        announcementId: req.params.id as string,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: true,
        replies: true,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.post('/comments/:commentId/replies', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ error: 'Reply content is required' });
      return;
    }

    const reply = await prisma.reply.create({
      data: {
        content: content.trim(),
        authorId: req.user!.id,
        commentId: req.params.commentId as string,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: true,
      },
    });

    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

router.post('/react', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { emoji, label, announcementId, commentId, replyId } = req.body;

    const existing = await prisma.reaction.findFirst({
      where: {
        authorId: req.user!.id,
        announcementId: announcementId || null,
        commentId: commentId || null,
        replyId: replyId || null,
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        res.json({ message: 'Reaction removed' });
        return;
      }
      const updated = await prisma.reaction.update({
        where: { id: existing.id },
        data: { emoji, label },
        include: { author: { select: { id: true, displayName: true } } },
      });
      res.json(updated);
      return;
    }

    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        label,
        authorId: req.user!.id,
        announcementId: announcementId || null,
        commentId: commentId || null,
        replyId: replyId || null,
      },
      include: { author: { select: { id: true, displayName: true } } },
    });

    res.status(201).json(reaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to handle reaction' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.announcement.delete({ where: { id: String(_req.params.id) } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
