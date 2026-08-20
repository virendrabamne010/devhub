import { useEffect, useState } from 'react';
import {
  FolderKanban,
  Rocket,
  Users,
  Activity,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';
import type { DashboardStats, Deployment } from '@/types';
import { relativeTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#10b981',
  IN_PROGRESS: '#3b82f6',
  QUEUED: '#f59e0b',
  PENDING: '#a855f7',
  FAILED: '#ef4444',
  CANCELLED: '#64748b',
  ROLLED_BACK: '#f97316',
};

type WeeklyBucket = {
  SUCCESS: number;
  FAILED: number;
  IN_PROGRESS: number;
  QUEUED: number;
  PENDING: number;
  CANCELLED: number;
  ROLLED_BACK: number;
};

const EMPTY_BUCKET: WeeklyBucket = {
  SUCCESS: 0,
  FAILED: 0,
  IN_PROGRESS: 0,
  QUEUED: 0,
  PENDING: 0,
  CANCELLED: 0,
  ROLLED_BACK: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
        setDeployments(data.recentDeployments || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const successRate = stats
    ? stats.totalDeployments
      ? Math.round((stats.successfulDeployments / stats.totalDeployments) * 100)
      : 100
    : 0;

  const weeklyByDate = new Map<string, WeeklyBucket>();
  if (stats?.deploymentsLast7Days) {
    for (const row of stats.deploymentsLast7Days) {
      if (!weeklyByDate.has(row.date)) {
        weeklyByDate.set(row.date, { ...EMPTY_BUCKET });
      }
      const bucket = weeklyByDate.get(row.date)!;
      const key = row.status in bucket ? (row.status as keyof WeeklyBucket) : ('QUEUED' as keyof WeeklyBucket);
      bucket[key] = (bucket[key] || 0) + (row.count || 1);
    }
  }
  const weeklyChart = Array.from(weeklyByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const pieData = stats
    ? [
        { name: 'Success', value: stats.successfulDeployments, color: STATUS_COLORS.SUCCESS },
        {
          name: 'Failed',
          value: Math.max(0, stats.totalDeployments - stats.successfulDeployments),
          color: STATUS_COLORS.FAILED,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your DevOps platform activity
        </p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading dashboard...</div>
      ) : error ? (
        <div className="card p-6 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={FolderKanban}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <StatCard
              title="Total Deployments"
              value={stats?.totalDeployments ?? 0}
              icon={Rocket}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={CheckCircle2}
              description={`${stats?.successfulDeployments ?? 0} successful`}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              title="Active Targets"
              value={stats?.activeMonitoringTargets ?? 0}
              icon={Activity}
              description={`${stats?.avgUptimePercent ?? 0}% avg uptime`}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              title="Teams"
              value={stats?.totalTeams ?? 0}
              icon={Users}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
            />
            <StatCard
              title="Platform Users"
              value={stats?.totalUsers ?? 0}
              icon={TrendingUp}
              iconBg="bg-pink-50"
              iconColor="text-pink-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-slate-900">Deployments last 7 days</h3>
              </div>
              <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" fontSize={12} stroke="#64748b" />
                    <YAxis fontSize={12} stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="SUCCESS" name="Success" stackId="a" fill={STATUS_COLORS.SUCCESS} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="IN_PROGRESS" name="In Progress" stackId="a" fill={STATUS_COLORS.IN_PROGRESS} />
                    <Bar dataKey="QUEUED" name="Queued" stackId="a" fill={STATUS_COLORS.QUEUED} />
                    <Bar dataKey="PENDING" name="Pending" stackId="a" fill={STATUS_COLORS.PENDING} />
                    <Bar dataKey="FAILED" name="Failed" stackId="a" fill={STATUS_COLORS.FAILED} />
                    <Bar dataKey="ROLLED_BACK" name="Rolled Back" stackId="a" fill={STATUS_COLORS.ROLLED_BACK} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-slate-900">Deployment Outcomes</h3>
              </div>
              <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Deployments</h3>
              <span className="text-xs text-slate-500">Last 10 deploys</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Version</th>
                    <th className="px-6 py-3">Environment</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Initiated</th>
                    <th className="px-6 py-3">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deployments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No deployments yet.
                      </td>
                    </tr>
                  )}
                  {deployments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-700">
                        {d.version}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <span className="badge-slate">{d.environment?.name || d.environmentId}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                        {d.initiatedBy?.name || 'System'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-slate-500">
                        {relativeTime(d.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'SUCCESS'
      ? 'badge-success'
      : status === 'IN_PROGRESS'
        ? 'badge-info'
        : status === 'QUEUED'
          ? 'badge-warning'
          : status === 'FAILED'
            ? 'badge-danger'
            : 'badge-slate';
  const label = status.replace(/_/g, ' ');
  return <span className={cls}>{label}</span>;
}