import { db } from '@devhub/database';
import { logger } from './lib/logger';

let monitoringInterval: NodeJS.Timeout | null = null;
let deploymentInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;
let pingCleanupInterval: NodeJS.Timeout | null = null;
const pendingTimeouts = new Set<NodeJS.Timeout>();

// Perform a real HTTP ping against a monitoring target
async function realPing(targetId: string, url: string, method: string, timeoutMs: number): Promise<void> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: method || 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'DevHub-Monitor/2.0',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const isUp = response.status >= 200 && response.status < 400;

    await db.pingHistory.create({
      data: {
        targetId,
        status: response.status,
        responseTimeMs,
        isUp,
        errorMessage: isUp ? undefined : `HTTP ${response.status} ${response.statusText}`,
      },
    });
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError';

    await db.pingHistory.create({
      data: {
        targetId,
        status: isTimeout ? 408 : 0,
        responseTimeMs: Math.min(responseTimeMs, timeoutMs),
        isUp: false,
        errorMessage: isTimeout ? 'Request Timeout' : (err?.message || 'Connection failed'),
      },
    });
  }
}

async function runMonitoringChecks(): Promise<void> {
  try {
    const targets = await db.monitoringTarget.findMany({
      where: { isActive: true },
    });

    for (const target of targets) {
      try {
        await realPing(target.id, target.url, target.method, target.timeout);
      } catch (err) {
        logger.error(`[MONITOR] Failed to check target ${target.id}`, { err });
      }
    }
  } catch (err) {
    logger.error('[MONITOR] Error in monitoring loop', { err });
  }
}

async function runDeploymentSimulation(): Promise<void> {
  try {
    const queuedDeployments = await db.deployment.findMany({
      where: { status: 'QUEUED' },
      take: 2,
    });

    for (const deployment of queuedDeployments) {
      await db.deployment.update({
        where: { id: deployment.id },
        data: { status: 'IN_PROGRESS' },
      });

      const timer = setTimeout(async () => {
        try {
          const success = Math.random() < 0.85;
          const newStatus = success ? 'SUCCESS' : 'FAILED';
          const logs = success
            ? `[SIMULATION] [${new Date().toISOString()}] Pulling image...\n[${new Date().toISOString()}] Building...\n[${new Date().toISOString()}] Deploying...\n[${new Date().toISOString()}] ✓ Deployment successful!`
            : `[SIMULATION] [${new Date().toISOString()}] Pulling image...\n[${new Date().toISOString()}] Building...\n[${new Date().toISOString()}] ✗ Build failed: Out of memory`;

          await db.deployment.update({
            where: { id: deployment.id },
            data: {
              status: newStatus,
              completedAt: new Date(),
              logs,
            },
          });

          await db.activityLog.create({
            data: {
              userId: deployment.initiatorId || undefined,
              type: newStatus === 'SUCCESS' ? 'DEPLOYMENT_SUCCESS' : 'DEPLOYMENT_FAILED',
              details: JSON.stringify({
                deploymentId: deployment.id,
                version: deployment.version,
                simulated: true,
              }),
            },
          });

          if (deployment.initiatorId) {
            await db.notification.create({
              data: {
                userId: deployment.initiatorId,
                type: newStatus === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
                title: newStatus === 'SUCCESS' ? 'Deployment Successful' : 'Deployment Failed',
                message: `[Simulated] Deployment ${deployment.version || deployment.id} ${newStatus === 'SUCCESS' ? 'deployed successfully' : 'failed to deploy'}`,
                linkUrl: `/deployments/${deployment.id}`,
              },
            });
          }
        } catch (err) {
          logger.error(`[DEPLOY-SIM] Error completing deployment ${deployment.id}`, { err });
        }
      }, 3000 + Math.random() * 5000);
      pendingTimeouts.add(timer);
      timer.unref?.();
    }

    const inProgressDeployments = await db.deployment.findMany({
      where: { status: 'IN_PROGRESS' },
      take: 1,
    });

    for (const deployment of inProgressDeployments) {
      const age = Date.now() - (deployment.startedAt?.getTime() || 0);
      if (age > 15000) {
        const success = Math.random() < 0.9;
        await db.deployment.update({
          where: { id: deployment.id },
          data: {
            status: success ? 'SUCCESS' : 'FAILED',
            completedAt: new Date(),
            logs: `[SIMULATION] [${new Date().toISOString()}] Auto-completed after ${age}ms`,
          },
        });
      }
    }
  } catch (err) {
    logger.error('[DEPLOY-SIM] Error in deployment simulation', { err });
  }
}

// Clean up expired and revoked refresh tokens periodically
async function runTokenCleanup(): Promise<void> {
  try {
    const result = await db.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    if (result.count > 0) {
      logger.info(`[TOKEN-CLEANUP] Removed ${result.count} expired/old refresh tokens`);
    }
  } catch (err) {
    logger.error('[TOKEN-CLEANUP] Error cleaning up refresh tokens', { err });
  }
}

// Clean up old ping history to prevent unbounded table growth
async function runPingHistoryCleanup(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db.pingHistory.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
      },
    });
    if (result.count > 0) {
      logger.info(`[PING-CLEANUP] Removed ${result.count} ping records older than 30 days`);
    }
  } catch (err) {
    logger.error('[PING-CLEANUP] Error cleaning up ping history', { err });
  }
}

export function startBackgroundWorkers(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  if (deploymentInterval) {
    clearInterval(deploymentInterval);
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  if (pingCleanupInterval) {
    clearInterval(pingCleanupInterval);
  }

  runMonitoringChecks();
  monitoringInterval = setInterval(runMonitoringChecks, 30000);

  runDeploymentSimulation();
  deploymentInterval = setInterval(runDeploymentSimulation, 10000);

  runTokenCleanup();
  cleanupInterval = setInterval(runTokenCleanup, 6 * 60 * 60 * 1000); // every 6 hours

  runPingHistoryCleanup();
  pingCleanupInterval = setInterval(runPingHistoryCleanup, 24 * 60 * 60 * 1000); // every 24 hours

  logger.info('📡 Background workers started:\n' +
    '   - Monitoring checks: every 30s (real HTTP pings)\n' +
    '   - Deployment simulator: every 10s [SIMULATED]\n' +
    '   - Refresh-token cleanup: every 6h\n' +
    '   - Ping history cleanup: every 24h (retains 30 days)');
}

export function stopBackgroundWorkers(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  if (deploymentInterval) {
    clearInterval(deploymentInterval);
    deploymentInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  if (pingCleanupInterval) {
    clearInterval(pingCleanupInterval);
    pingCleanupInterval = null;
  }
  // Cancel any pending deployment timeouts
  pendingTimeouts.forEach((t) => clearTimeout(t));
  pendingTimeouts.clear();
  logger.info('🛑 Background workers stopped');
}
