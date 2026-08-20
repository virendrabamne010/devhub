import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Use crypto.randomUUID() which works in Node.js 18.7+ and 19+
// Fallback for older Node versions
const uuidv4 = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback: generate a UUID v4 manually
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

const prisma = new PrismaClient();

// Helper: return a Date offset by `days` days (and `hours` hours) from now.
// Used to keep seeded data "live" so dashboard charts show meaningful recent activity.
const daysAgo = (days: number, hours = 0): Date => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);
};

async function main() {
  // Safety guard: never seed a production database
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed production database. Set NODE_ENV to development or test.');
  }

  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.pingHistory.deleteMany();
  await prisma.monitoringTarget.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('DevHub@123', 10);
  
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@devhub.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const manager = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'manager@devhub.com',
      passwordHash,
      name: 'Project Manager',
      role: 'MANAGER',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    },
  });

  const developer = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'developer@devhub.com',
      passwordHash,
      name: 'Dev Developer',
      role: 'DEVELOPER',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
    },
  });

  console.log('✅ Users created');

  // Create Teams
  const teamAlpha = await prisma.team.create({
    data: {
      id: uuidv4(),
      name: 'Alpha Team',
      description: 'Core platform development team',
    },
  });

  const teamBeta = await prisma.team.create({
    data: {
      id: uuidv4(),
      name: 'Beta Team',
      description: 'Infrastructure and DevOps team',
    },
  });

  console.log('✅ Teams created');

  // Add Team Members
  await prisma.teamMember.createMany({
    data: [
      { teamId: teamAlpha.id, userId: admin.id, role: 'OWNER' },
      { teamId: teamAlpha.id, userId: manager.id, role: 'ADMIN' },
      { teamId: teamAlpha.id, userId: developer.id, role: 'MEMBER' },
      { teamId: teamBeta.id, userId: admin.id, role: 'OWNER' },
      { teamId: teamBeta.id, userId: manager.id, role: 'ADMIN' },
    ],
  });

  console.log('✅ Team members created');

  // Create Projects
  const projectFrontend = await prisma.project.create({
    data: {
      id: uuidv4(),
      name: 'Frontend Web App',
      description: 'React-based user dashboard',
      status: 'ACTIVE',
      teamId: teamAlpha.id,
    },
  });

  const projectAPI = await prisma.project.create({
    data: {
      id: uuidv4(),
      name: 'API Gateway',
      description: 'Node.js API server',
      status: 'ACTIVE',
      teamId: teamAlpha.id,
    },
  });

  const projectInfra = await prisma.project.create({
    data: {
      id: uuidv4(),
      name: 'Infrastructure Monitoring',
      description: 'Monitoring and alerting system',
      status: 'ACTIVE',
      teamId: teamBeta.id,
    },
  });

  console.log('✅ Projects created');

  // Create Repositories
  const repoFrontend = await prisma.repository.create({
    data: {
      id: uuidv4(),
      projectId: projectFrontend.id,
      name: 'devhub-frontend',
      url: 'https://github.com/devhub/frontend',
      provider: 'GITHUB',
      defaultBranch: 'main',
    },
  });

  const repoAPI = await prisma.repository.create({
    data: {
      id: uuidv4(),
      projectId: projectAPI.id,
      name: 'devhub-api',
      url: 'https://github.com/devhub/api',
      provider: 'GITHUB',
      defaultBranch: 'main',
    },
  });

  console.log('✅ Repositories created');

  // Create Commits
  const commit1 = await prisma.commit.create({
    data: {
      id: uuidv4(),
      repositoryId: repoFrontend.id,
      authorId: developer.id,
      sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      message: 'feat: Add dashboard page with charts',
      branch: 'main',
      url: 'https://github.com/devhub/frontend/commit/a1b2c3d',
      additions: 245,
      deletions: 12,
      committedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // ~1 hour ago
    },
  });

const commit2 = await prisma.commit.create({
    data: {
      id: uuidv4(),
      repositoryId: repoAPI.id,
      authorId: developer.id,
      sha: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
      message: 'fix: Update authentication middleware',
      branch: 'main',
      url: 'https://github.com/devhub/api/commit/b2c3d4e',
      additions: 89,
      deletions: 23,
      committedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // ~2 hours ago
    },
  });

  console.log('✅ Commits created');

  // Create Environments
  const envDev = await prisma.environment.create({
    data: {
      id: uuidv4(),
      projectId: projectFrontend.id,
      name: 'development',
      url: 'https://dev.devhub.com',
      branch: 'develop',
    },
  });

  const envStaging = await prisma.environment.create({
    data: {
      id: uuidv4(),
      projectId: projectFrontend.id,
      name: 'staging',
      url: 'https://staging.devhub.com',
      branch: 'staging',
    },
  });

  const envProd = await prisma.environment.create({
    data: {
      id: uuidv4(),
      projectId: projectFrontend.id,
      name: 'production',
      url: 'https://devhub.com',
      branch: 'main',
    },
  });

  console.log('✅ Environments created');

  // Create Deployments
  await prisma.deployment.createMany({
    data: [
      {
        id: uuidv4(),
        repositoryId: repoFrontend.id,
        environmentId: envDev.id,
        commitId: commit1.id,
        initiatorId: developer.id,
status: 'SUCCESS',
        version: 'v1.0.0',
        startedAt: daysAgo(2, 3),
        completedAt: daysAgo(2, 2),
      },
      {
        id: uuidv4(),
        repositoryId: repoFrontend.id,
        environmentId: envStaging.id,
        commitId: commit1.id,
        initiatorId: manager.id,
        status: 'SUCCESS',
        version: 'v1.0.0',
        startedAt: daysAgo(1, 5),
        completedAt: daysAgo(1, 4),
      },
      {
        id: uuidv4(),
        repositoryId: repoAPI.id,
        environmentId: envProd.id,
        commitId: commit2.id,
        initiatorId: admin.id,
        status: 'IN_PROGRESS',
        version: 'v2.1.0',
        startedAt: daysAgo(0, 1),
      },
    ],
  });

  console.log('✅ Deployments created');

  // Create Monitoring Targets
  const target1 = await prisma.monitoringTarget.create({
    data: {
      id: uuidv4(),
      environmentId: envProd.id,
      name: 'Production Homepage',
      url: 'https://devhub.com',
      method: 'GET',
      checkInterval: 60,
      timeout: 5000,
    },
  });

  const target2 = await prisma.monitoringTarget.create({
    data: {
      id: uuidv4(),
      environmentId: envProd.id,
      name: 'API Health Check',
      url: 'https://api.devhub.com/health',
      method: 'GET',
      checkInterval: 30,
      timeout: 3000,
    },
  });

  console.log('✅ Monitoring targets created');

  // Create Ping History
  await prisma.pingHistory.createMany({
    data: [
      { targetId: target1.id, status: 200, responseTimeMs: 234, isUp: true, timestamp: new Date() },
      { targetId: target1.id, status: 200, responseTimeMs: 312, isUp: true, timestamp: new Date(Date.now() - 60000) },
      { targetId: target1.id, status: 502, responseTimeMs: 5000, isUp: false, errorMessage: 'Gateway Timeout', timestamp: new Date(Date.now() - 120000) },
      { targetId: target2.id, status: 200, responseTimeMs: 45, isUp: true, timestamp: new Date() },
      { targetId: target2.id, status: 200, responseTimeMs: 52, isUp: true, timestamp: new Date(Date.now() - 30000) },
    ],
  });

  console.log('✅ Ping history created');

  // Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { projectId: projectFrontend.id, userId: developer.id, type: 'COMMIT', details: JSON.stringify({ sha: commit1.sha, message: commit1.message }) },
      { projectId: projectFrontend.id, userId: developer.id, type: 'DEPLOYMENT', details: JSON.stringify({ environment: 'development', version: 'v1.0.0' }) },
      { projectId: projectAPI.id, userId: admin.id, type: 'DEPLOYMENT', details: JSON.stringify({ environment: 'production', version: 'v2.1.0' }) },
    ],
  });

  console.log('✅ Activity logs created');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      { userId: developer.id, type: 'SUCCESS', title: 'Deployment Successful', message: 'Frontend v1.0.0 deployed to development', linkUrl: '/deployments/1' },
      { userId: manager.id, type: 'INFO', title: 'New Team Member', message: 'Developer joined Alpha Team', linkUrl: '/teams/alpha' },
      { userId: admin.id, type: 'WARNING', title: 'Monitoring Alert', message: 'Production homepage was down (502)', linkUrl: '/monitoring' },
    ],
  });

  console.log('✅ Notifications created');

  // Create API Keys
  await prisma.apiKey.createMany({
    data: [
      { name: 'Production API Key', keyHash: await bcrypt.hash('prod-key-hash', 10), prefix: 'dev_prod', isActive: true },
      { name: 'Development API Key', keyHash: await bcrypt.hash('dev-key-hash', 10), prefix: 'dev_dev', isActive: true },
    ],
  });

  console.log('✅ API keys created');

  // Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'LOGIN', resource: 'Session', metadata: JSON.stringify({ ip: '192.168.1.1' }) },
      { userId: developer.id, action: 'CREATE', resource: 'Commit', resourceId: commit1.id, metadata: JSON.stringify({ sha: commit1.sha }) },
      { userId: admin.id, action: 'UPDATE', resource: 'Deployment', resourceId: '1', metadata: JSON.stringify({ status: 'IN_PROGRESS' }) },
    ],
  });

  console.log('✅ Audit logs created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Credentials:');
  console.log('   Admin:     admin@devhub.com / DevHub@123');
  console.log('   Manager:   manager@devhub.com / DevHub@123');
  console.log('   Developer: developer@devhub.com / DevHub@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
