import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, TeamSchemas } from '../middleware/validate';

const router = Router();

// GET /api/teams
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      db.team.findMany({
        include: {
          _count: { select: { members: true, projects: true } },
          members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.team.count(),
    ]);
    return res.json({ teams, total, page, limit });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), validate(TeamSchemas.create), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const team = await db.team.create({
      data: { name, description },
      include: { _count: { select: { members: true, projects: true } } },
    });

    await db.teamMember.create({ data: { teamId: team.id, userId: req.userId!, role: 'OWNER' } });

    return res.status(201).json({ team });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ error: 'Failed to create team' });
  }
});

// GET /api/teams/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const team = await db.team.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } },
        projects: { include: { _count: { select: { environments: true, repos: true } } } },
        _count: true,
      },
    });

    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST /api/teams/:id/members - Add member
router.post('/:id/members', authenticate, authorize('ADMIN', 'MANAGER'), validate(TeamSchemas.addMember), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body;

    const team = await db.team.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (req.userRole === 'MANAGER') {
      const membership = await db.teamMember.findFirst({
        where: { teamId: req.params.id, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } }
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden. You are not an admin of this team.' });
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isActive) return res.status(400).json({ error: 'Cannot add a deactivated user to a team' });

    const member = await db.teamMember.create({
      data: { teamId: req.params.id, userId, role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
    });
    return res.status(201).json({ member });
  } catch (error) {
    if ((error as any)?.code === 'P2002') return res.status(409).json({ error: 'Member already exists in team' });
    console.error('Error adding member:', error);
    return res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /api/teams/:id/members/:memberId
router.delete('/:id/members/:memberId', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole === 'MANAGER') {
      const membership = await db.teamMember.findFirst({
        where: { teamId: req.params.id, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } }
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden. You are not an admin of this team.' });
    }

    await db.teamMember.delete({ where: { id: req.params.memberId } });
    return res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
