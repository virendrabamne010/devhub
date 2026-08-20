import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/auditlogs
router.get('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const auditLogs = await db.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ auditLogs });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
