import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await db.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db.notification.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
