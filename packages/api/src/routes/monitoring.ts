import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, MonitoringSchemas } from '../middleware/validate';

const router = Router();

// Helper: map DB target to frontend-compatible shape
function mapTarget(t: any) {
  const lastPing = t.pingHistory?.[0] || null;
  let lastStatus: 'UP' | 'DOWN' | 'DEGRADED' | null = null;
  if (lastPing) {
    if (lastPing.isUp && lastPing.responseTimeMs > 2000) lastStatus = 'DEGRADED';
    else if (lastPing.isUp) lastStatus = 'UP';
    else lastStatus = 'DOWN';
  }
  return {
    id: t.id,
    name: t.name,
    url: t.url,
    method: t.method,
    intervalSeconds: t.checkInterval,
    timeout: t.timeout,
    active: t.isActive,
    isActive: t.isActive,
    environmentId: t.environmentId,
    environment: t.environment,
    lastCheckedAt: lastPing?.timestamp || null,
    lastStatus,
    pingCount: t._count?.pingHistory ?? 0,
    createdAt: t.createdAt,
  };
}

// Helper: map ping history to frontend-compatible shape
function mapPing(p: any) {
  let status: 'UP' | 'DOWN' | 'DEGRADED' = 'UP';
  if (!p.isUp) status = 'DOWN';
  else if (p.responseTimeMs > 2000) status = 'DEGRADED';
  return {
    ...p,
    status,
    statusCode: p.status,
    checkedAt: p.timestamp,
  };
}

// Shared: fetch pings for a target
async function getPingsForTarget(targetId: string, limit: number = 50) {
  const pings = await db.pingHistory.findMany({
    where: { targetId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  return pings.map(mapPing);
}

// GET /api/monitoring/targets
router.get('/targets', authenticate, validate(MonitoringSchemas.listTargets, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const { environmentId } = req.query;
    const where: any = {};
    if (environmentId) where.environmentId = environmentId as string;

    const targets = await db.monitoringTarget.findMany({
      where,
      include: {
        environment: { select: { id: true, name: true, url: true, projectId: true } },
        pingHistory: { take: 1, orderBy: { timestamp: 'desc' } },
        _count: { select: { pingHistory: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ targets: targets.map(mapTarget) });
  } catch (error) {
    console.error('Error fetching monitoring targets:', error);
    return res.status(500).json({ error: 'Failed to fetch targets' });
  }
});

// POST /api/monitoring/targets
router.post('/targets', authenticate, authorize('ADMIN', 'MANAGER'), validate(MonitoringSchemas.createTarget), async (req: AuthRequest, res: Response) => {
  try {
    const { environmentId, name, url, method, checkInterval, timeout } = req.body;

    const target = await db.monitoringTarget.create({
      data: { environmentId, name, url, method, checkInterval, timeout },
      include: {
        environment: { select: { id: true, name: true } },
        pingHistory: { take: 1, orderBy: { timestamp: 'desc' } },
        _count: { select: { pingHistory: true } },
      },
    });

    return res.status(201).json({ target: mapTarget(target) });
  } catch (error) {
    console.error('Error creating target:', error);
    return res.status(500).json({ error: 'Failed to create target' });
  }
});

// GET /api/monitoring/targets/:targetId/pings  (frontend-compatible path)
router.get('/targets/:targetId/pings', authenticate, validate(MonitoringSchemas.listPings, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const pings = await getPingsForTarget(req.params.targetId, parseInt(limit as string, 10));
    return res.json({ pings });
  } catch (error) {
    console.error('Error fetching pings:', error);
    return res.status(500).json({ error: 'Failed to fetch pings' });
  }
});

// GET /api/monitoring/pings/:targetId  (legacy path - kept for backward compat)
router.get('/pings/:targetId', authenticate, validate(MonitoringSchemas.listPings, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const pings = await getPingsForTarget(req.params.targetId, parseInt(limit as string, 10));
    return res.json({ pings });
  } catch (error) {
    console.error('Error fetching pings:', error);
    return res.status(500).json({ error: 'Failed to fetch pings' });
  }
});

// POST /api/monitoring/pings - Record a ping result
router.post('/pings', authenticate, validate(MonitoringSchemas.createPing), async (req: AuthRequest, res: Response) => {
  try {
    const { targetId, status, responseTimeMs, isUp, errorMessage } = req.body;
    const ping = await db.pingHistory.create({
      data: { targetId, status, responseTimeMs, isUp, errorMessage },
    });
    return res.status(201).json({ ping });
  } catch (error) {
    console.error('Error recording ping:', error);
    return res.status(500).json({ error: 'Failed to record ping' });
  }
});

// GET /api/monitoring/dashboard - Dashboard stats
router.get('/dashboard', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const allTargets = await db.monitoringTarget.findMany({
      include: {
        pingHistory: { take: 1, orderBy: { timestamp: 'desc' } },
      },
    });

    const totalTargets = allTargets.length;
    let upTargets = 0;
    let downTargets = 0;

    for (const t of allTargets) {
      const lastPing = t.pingHistory?.[0];
      if (!lastPing) continue;
      if (lastPing.isUp) upTargets++;
      else downTargets++;
    }

    const totalPings = await db.pingHistory.count();
    const successfulPings = await db.pingHistory.count({ where: { isUp: true } });
    const avgUptimePercent = totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 100;

    const failedChecks24h = await db.pingHistory.count({
      where: { isUp: false, timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    const recentPings = await db.pingHistory.findMany({
      take: 1,
      orderBy: { timestamp: 'desc' },
      select: { isUp: true, responseTimeMs: true, timestamp: true },
    });

    return res.json({
      stats: {
        totalTargets,
        upTargets,
        downTargets,
        avgUptimePercent,
        failedChecks24h,
        lastCheck: recentPings[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

export default router;