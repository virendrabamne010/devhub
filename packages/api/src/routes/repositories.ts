import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/repositories
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const repositories = await db.repository.findMany();
    return res.json({ repositories });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;
