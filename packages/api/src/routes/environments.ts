import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/environments
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const environments = await db.environment.findMany();
    return res.json({ environments });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch environments' });
  }
});

export default router;
