import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, ProjectSchemas } from '../middleware/validate';

const router = Router();

// GET /api/projects
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      db.project.findMany({
        include: {
          team: { select: { id: true, name: true } },
          _count: { select: { environments: true, repos: true, activityLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.project.count(),
    ]);
    return res.json({ projects, total, page, limit });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects (Admin/Manager only)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), validate(ProjectSchemas.create), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, teamId } = req.body;

    if (req.userRole === 'MANAGER') {
      const membership = await db.teamMember.findFirst({
        where: { teamId, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } }
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden. You are not a manager of this team.' });
    }

    const project = await db.project.create({
      data: { name, description, teamId },
      include: { team: { select: { id: true, name: true } } },
    });

    await db.activityLog.create({
      data: { projectId: project.id, userId: req.userId, type: 'PROJECT_CREATED', details: JSON.stringify({ name }) },
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await db.project.findUnique({
      where: { id: req.params.id },
      include: {
        team: { select: { id: true, name: true } },
        environments: true,
        repos: { include: { _count: { select: { commits: true, deployments: true } } } },
        activityLogs: { take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { environments: true, repos: true, activityLogs: true } },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PATCH /api/projects/:id (Admin/Manager only)
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), validate(ProjectSchemas.update), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status } = req.body;
    
    // Check if manager is part of the project's team
    if (req.userRole === 'MANAGER') {
      const project = await db.project.findUnique({ where: { id: req.params.id }, select: { teamId: true } });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      
      const membership = await db.teamMember.findFirst({
        where: { teamId: project.teamId, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } }
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden. You are not a manager of this team.' });
    }

    const project = await db.project.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description && { description }), ...(status && { status }) },
    });
    return res.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id (Admin/Manager only)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const project = await db.project.findUnique({ where: { id: req.params.id }, select: { teamId: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.userRole === 'MANAGER') {
      const membership = await db.teamMember.findFirst({
        where: { teamId: project.teamId, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } }
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden. You are not a manager of this team.' });
    }

    await db.project.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' }
    });

    await db.activityLog.create({
      data: { projectId: req.params.id, userId: req.userId, type: 'PROJECT_ARCHIVED', details: '{}' },
    });

    return res.json({ message: 'Project archived successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to archive project' });
  }
});

export default router;
