/**
 * Direct Messages Routes
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../config/storage.js';

const router = Router();

const userSelect = { id: true, displayName: true, avatarUrl: true };

// Get all conversations for the current user
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const conversations = await prisma.directConversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: userSelect },
        user2: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: userSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add unread count per conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        const lastMessage = conv.messages[0] || null;
        return {
          id: conv.id,
          otherUser,
          lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json(withUnread);
  } catch (err) {
    console.error('[DM] Conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get or create a conversation with a specific user
router.post('/conversations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.body;

    if (!targetUserId || targetUserId === userId) {
      res.status(400).json({ error: 'Invalid target user' });
      return;
    }

    // Ensure consistent ordering for the unique constraint
    const [u1, u2] = [userId, targetUserId].sort();

    let conversation = await prisma.directConversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!conversation) {
      conversation = await prisma.directConversation.create({
        data: { user1Id: u1, user2Id: u2 },
      });
    }

    res.json({ conversationId: conversation.id });
  } catch (err) {
    console.error('[DM] Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user belongs to this conversation
    const conv = await prisma.directConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || (conv.user1Id !== userId && conv.user2Id !== userId)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      include: { sender: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mark unread messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error('[DM] Messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/conversations/:id/messages', authenticate, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const { content } = req.body;

    if (!content?.trim() && !req.file) {
      res.status(400).json({ error: 'Message content or image required' });
      return;
    }

    // Verify user belongs to this conversation
    const conv = await prisma.directConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || (conv.user1Id !== userId && conv.user2Id !== userId)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      try {
        imageUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);
      } catch (uploadErr) {
        console.error('[DM] Image upload failed:', uploadErr);
      }
    }

    const message = await prisma.directMessage.create({
      data: {
        content: content?.trim() || '',
        imageUrl,
        senderId: userId,
        conversationId,
      },
      include: { sender: { select: userSelect } },
    });

    // Update conversation timestamp
    await prisma.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('[DM] Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get total unread DM count (for badge)
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await prisma.directMessage.count({
      where: {
        conversation: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    res.json({ count });
  } catch (err) {
    console.error('[DM] Unread count error:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export default router;
