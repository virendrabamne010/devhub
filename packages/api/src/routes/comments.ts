import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/comments/:resource/:resourceId
router.get('/:resource/:resourceId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await db.comment.findMany({
      where: { resource: req.params.resource, resourceId: req.params.resourceId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ comments });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;
