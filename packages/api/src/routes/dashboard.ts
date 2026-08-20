import { Router, Response } from 'express';
import { db } from '@devhub/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalProjects,
      totalTeams,
      totalUsers,
      totalDeployments,
      successfulDeployments,
      recentDeployments,
      activeMonitoringTargets,
      commitsToday,
    ] = await Promise.all([
      db.project.count(),
      db.team.count(),
      db.user.count({ where: { isActive: true } }),
      db.deployment.count(),
      db.deployment.count({ where: { status: 'SUCCESS' } }),
      db.deployment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          repository: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
          environment: { select: { id: true, name: true } },
          initiator: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      db.monitoringTarget.count({ where: { isActive: true } }),
      db.commit.count({
        where: { committedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Build deployments per day for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDeploymentsForChart = await db.deployment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { status: true, createdAt: true },
    });

    const dayMap = new Map<string, { date: string; SUCCESS: number; FAILED: number; IN_PROGRESS: number; QUEUED: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dayMap.set(dateStr, { date: dateStr, SUCCESS: 0, FAILED: 0, IN_PROGRESS: 0, QUEUED: 0 });
    }
    for (const dep of recentDeploymentsForChart) {
      const dateStr = dep.createdAt.toISOString().split('T')[0];
      if (dayMap.has(dateStr)) {
        const bucket = dayMap.get(dateStr)!;
        const statusKey = (dep.status as 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'QUEUED') in bucket
          ? (dep.status as 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'QUEUED')
          : 'QUEUED';
        bucket[statusKey]++;
      }
    }
    const deploymentsLast7Days = Array.from(dayMap.values()).flatMap((bucket) =>
      (['SUCCESS', 'FAILED', 'IN_PROGRESS', 'QUEUED'] as const).map((status) => ({
        date: bucket.date,
        status,
        count: bucket[status],
      })),
    );

    // Calculate average uptime from ping history
    const totalPings = await db.pingHistory.count();
    const successfulPings = await db.pingHistory.count({ where: { isUp: true } });
    const avgUptimePercent = totalPings > 0 ? Math.round((successfulPings / totalPings) * 100) : 100;

    // Map recentDeployments to include project and initiatedBy for frontend compatibility
    const mappedRecent = recentDeployments.map((d) => ({
      ...d,
      project: d.repository?.project || null,
      initiatedBy: d.initiator,
      environmentId: d.environmentId,
      version: d.version || '',
    }));

    return res.json({
      totalProjects,
      totalTeams,
      totalUsers,
      totalDeployments,
      successfulDeployments,
      commitsToday,
      activeMonitoringTargets,
      avgUptimePercent,
      deploymentSuccessRate: totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0,
      deploymentsLast7Days,
      recentDeployments: mappedRecent,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/activity
router.get('/activity', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const activityLogs = await db.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return res.json({ activityLogs });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
