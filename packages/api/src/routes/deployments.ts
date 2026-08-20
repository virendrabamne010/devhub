import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, DeploymentSchemas } from '../middleware/validate';

const router = Router();

// GET /api/deployments
router.get('/', authenticate, validate(DeploymentSchemas.list, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, repositoryId, environmentId, status, limit } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((limit as string) || '20', 10);
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) where.repository = { projectId: projectId as string };
    if (repositoryId) where.repositoryId = repositoryId as string;
    if (environmentId) where.environmentId = environmentId as string;
    if (status && status !== 'all') where.status = status as string;

    const [deployments, total] = await Promise.all([
      db.deployment.findMany({
        where,
        include: {
          repository: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
          environment: { select: { id: true, name: true } },
          commit: { select: { id: true, message: true, sha: true } },
          initiator: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.deployment.count({ where }),
    ]);

    // Map to include project and initiatedBy for frontend compatibility
    const mapped = deployments.map((d) => ({
      ...d,
      project: d.repository?.project || null,
      initiatedBy: d.initiator,
    }));

    return res.json({ deployments: mapped, total, page, limit: pageSize });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// POST /api/deployments
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'DEVELOPER'), validate(DeploymentSchemas.create), async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId, environmentId, commitId, version } = req.body;
    
    const deployment = await db.deployment.create({
      data: {
        repositoryId,
        environmentId,
        commitId,
        initiatorId: req.userId!,
        version: version || `v${Date.now()}`,
        status: 'QUEUED',
        startedAt: new Date(),
      },
      include: {
        repository: { select: { id: true, name: true } },
        environment: { select: { id: true, name: true } },
        commit: { select: { id: true, message: true, sha: true } },
        initiator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await db.activityLog.create({
      data: {
        userId: req.userId,
        type: 'DEPLOYMENT_STARTED',
        details: JSON.stringify({ deploymentId: deployment.id, version }),
      },
    });

    return res.status(201).json({ deployment });
  } catch (error) {
    console.error('Error creating deployment:', error);
    return res.status(500).json({ error: 'Failed to create deployment' });
  }
});

// GET /api/deployments/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const deployment = await db.deployment.findUnique({
      where: { id: req.params.id },
      include: {
        repository: { select: { id: true, name: true, url: true } },
        environment: { select: { id: true, name: true, url: true } },
        commit: { select: { id: true, message: true, sha: true, url: true, additions: true, deletions: true } },
        initiator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
    return res.json({ deployment });
  } catch (error) {
    console.error('Error fetching deployment:', error);
    return res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

// PATCH /api/deployments/:id - Update status (Admin/Manager only)
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), validate(DeploymentSchemas.update), async (req: AuthRequest, res: Response) => {
  try {
    const { status, logs } = req.body;
    const data: any = { ...(status && { status }) };
    
    if (logs) data.logs = logs;
    if (status === 'SUCCESS' || status === 'FAILED') data.completedAt = new Date();

    const deployment = await db.deployment.update({
      where: { id: req.params.id },
      data,
      include: {
        repository: { select: { id: true, name: true } },
        environment: { select: { id: true, name: true } },
      },
    });

    return res.json({ deployment });
  } catch (error) {
    console.error('Error updating deployment:', error);
    return res.status(500).json({ error: 'Failed to update deployment' });
  }
});

export default router;
