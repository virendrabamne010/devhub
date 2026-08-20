export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type DeploymentStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED';
export type CommitStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type PingStatus = 'UP' | 'DOWN' | 'DEGRADED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type WebhookEvent =
  | 'DEPLOYMENT_CREATED'
  | 'DEPLOYMENT_STATUS_CHANGED'
  | 'MONITORING_ALERT'
  | 'USER_CREATED'
  | 'TEAM_CREATED'
  | 'PROJECT_CREATED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: { teams?: number; notifications?: number; commits?: number; deployments?: number; comments?: number };
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  user?: User;
  team?: Team;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  teamId: string;
  team?: Team;
  repos?: Repository[];
  environments?: Environment[];
  activityLogs?: ActivityLog[];
  _count?: { environments: number; repos: number; activityLogs: number };
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  url?: string | null;
  projectId: string;
  project?: Project;
  commits?: Commit[];
}

export interface Commit {
  id: string;
  sha: string;
  message: string;
  author?: { id: string; name: string; avatarUrl?: string | null } | null;
  branch: string;
  status?: CommitStatus;
  repositoryId: string;
  committedAt: string;
  url?: string | null;
  additions?: number;
  deletions?: number;
}

export interface Environment {
  id: string;
  name: string;
  url?: string | null;
  branch?: string | null;
  projectId: string;
}

export interface Deployment {
  id: string;
  status: DeploymentStatus;
  version: string;
  environmentId: string;
  project?: { id: string; name: string } | null;
  environment?: { id: string; name: string; url?: string } | null;
  initiatedBy?: { id: string; name: string; avatarUrl?: string | null } | null;
  commitId?: string | null;
  commit?: { id: string; message: string; sha: string; url?: string; additions?: number; deletions?: number } | null;
  logs?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface MonitoringTarget {
  id: string;
  name: string;
  url: string;
  method?: string;
  intervalSeconds: number;
  timeout?: number;
  active: boolean;
  isActive?: boolean;
  environmentId: string;
  environment?: { id: string; name: string; url?: string; projectId?: string } | null;
  createdAt: string;
  lastCheckedAt?: string | null;
  lastStatus?: PingStatus | null;
  pingCount?: number;
}

export interface PingHistory {
  id: string;
  targetId: string;
  status: PingStatus;
  responseTimeMs?: number | null;
  statusCode?: number | null;
  errorMessage?: string | null;
  checkedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalDeployments: number;
  successfulDeployments: number;
  activeMonitoringTargets: number;
  totalTeams: number;
  totalUsers: number;
  commitsToday?: number;
  deploymentSuccessRate?: number;
  deploymentsLast7Days: { date: string; count?: number; status: DeploymentStatus }[];
  avgUptimePercent: number;
  recentDeployments?: Deployment[];
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface ActivityLog {
  id: string;
  type: string;
  userId?: string | null;
  projectId?: string | null;
  details?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
  project?: { id: string; name: string } | null;
}
