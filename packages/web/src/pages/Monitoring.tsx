import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Plus, RefreshCw, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import type { MonitoringTarget, PingHistory } from '@/types';
import { cn, formatDate, relativeTime } from '@/lib/utils';

const STATUS_META: Record<string, { cls: string; icon: any; label: string }> = {
  UP: { cls: 'badge-success', icon: CheckCircle2, label: 'Up' },
  DOWN: { cls: 'badge-danger', icon: XCircle, label: 'Down' },
  DEGRADED: { cls: 'badge-warning', icon: AlertTriangle, label: 'Degraded' },
};

export default function Monitoring() {
  const [targets, setTargets] = useState<MonitoringTarget[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pings, setPings] = useState<PingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [checkInterval, setCheckInterval] = useState(30);
  const [environmentId, setEnvironmentId] = useState('');
  const [environments, setEnvironments] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [t, d, p] = await Promise.all([
        api.get('/monitoring/targets').then((r) => r.data.targets || []),
        api.get('/monitoring/dashboard').catch(() => ({ data: null })).then((r) => r?.data),
        api.get('/projects').then((r) => r.data.projects || r.data || []),
      ]);
      setTargets(t);
      setDashboard(d?.stats || d);
      // Collect all environments from all projects
      const allEnvs: { id: string; name: string }[] = [];
      for (const proj of p) {
        try {
          const projDetail = await api.get(`/projects/${proj.id}`).then((r) => r.data.project);
          if (projDetail?.environments) {
            for (const env of projDetail.environments) {
              allEnvs.push({ id: env.id, name: `${proj.name} - ${env.name}` });
            }
          }
        } catch {}
      }
      setEnvironments(allEnvs);
      if (allEnvs.length > 0 && !environmentId) setEnvironmentId(allEnvs[0].id);
      if (t.length > 0 && !selectedId) {
        setSelectedId(t[0].id);
        loadPings(t[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPings = async (targetId: string) => {
    try {
      const { data } = await api.get(`/monitoring/targets/${targetId}/pings?limit=50`);
      setPings(data.pings || []);
    } catch {
      setPings([]);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (selectedId) loadPings(selectedId);
  }, [selectedId]);

  const selected = targets.find((t) => t.id === selectedId) || null;

  const chartData = [...pings]
    .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime())
    .map((p) => ({
      time: new Date(p.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      responseTime: p.responseTimeMs || 0,
      status: p.status,
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/monitoring/targets', {
        name,
        url,
        checkInterval,
        environmentId,
        method: 'GET',
        timeout: 5000,
      });
      setName('');
      setUrl('https://');
      setCheckInterval(30);
      setCreating(false);
      load();
    } catch (e: any) {
      const resp = e?.response?.data;
      let msg = resp?.error || resp?.message || 'Failed to create target';
      if (resp?.details && Array.isArray(resp.details)) {
        msg = resp.details.map((x: any) => `${x.field}: ${x.message}`).join(', ');
      }
      alert(msg);
    }
  };

  const uptime = dashboard?.avgUptimePercent ?? 0;
  const totalTargets = dashboard?.totalTargets ?? targets.length;
  const upTargets = dashboard?.upTargets ?? targets.filter((t) => t.lastStatus === 'UP').length;
  const downTargets = dashboard?.downTargets ?? targets.filter((t) => t.lastStatus === 'DOWN').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
          <p className="mt-1 text-sm text-slate-500">
            Uptime: {typeof uptime === 'number' ? uptime.toFixed(2) : '0.00'}% • Auto-refresh every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-outline">
            <RefreshCw size={16} className="mr-1" /> Refresh
          </button>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={16} className="mr-2" /> New Target
          </button>
        </div>
      </div>

      {creating && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Add monitoring target</h3>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="label">Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Production API" />
            </div>
            <div>
              <label className="label">URL</label>
              <input required value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://api.example.com/health" />
            </div>
            <div>
              <label className="label">Interval (seconds)</label>
              <input type="number" min={10} required value={checkInterval} onChange={(e) => setCheckInterval(Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="label">Environment</label>
              <select required value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)} className="input">
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-4">
              <button className="btn-primary" type="submit">Create Target</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Targets</p>
          <p className="mt-1 text-2xl font-bold">{totalTargets}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm text-slate-500">Healthy</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{upTargets}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-red-500">
          <p className="text-sm text-slate-500">Down / Degraded</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{downTargets}</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900">Targets</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {targets.length === 0 && (
                <li className="p-6 text-center text-sm text-slate-500">No targets yet.</li>
              )}
              {targets.map((t) => {
                const meta = t.lastStatus ? STATUS_META[t.lastStatus] : STATUS_META['UP'];
                const Icon = meta.icon;
                const isActive = t.id === selectedId;
                return (
                  <li
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      'cursor-pointer p-4 transition hover:bg-slate-50',
                      isActive && 'bg-brand-50/50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={cn(
                            t.lastStatus === 'UP' ? 'text-emerald-500' : t.lastStatus === 'DOWN' ? 'text-red-500' : 'text-amber-500'
                          )} />
                          <p className="truncate font-medium text-slate-900">{t.name}</p>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">{t.url}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={12} />
                          Every {t.intervalSeconds}s
                          {t.lastCheckedAt && <> • {relativeTime(t.lastCheckedAt)}</>}
                        </p>
                      </div>
                      <span className={meta.cls}>{meta.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card lg:col-span-2">
            <div className="card-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {selected ? selected.name : 'Response Time'}
                </h3>
                <p className="text-xs text-slate-500">{selected?.url}</p>
              </div>
              {selected && (
                <span className="badge-info">{selected.active ? 'Active' : 'Paused'}</span>
              )}
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Activity size={20} className="mr-2" /> No ping history yet for selected target.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" unit="ms" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="border-t border-slate-200">
              <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent Pings
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500">
                    <tr>
                      <th className="px-6 py-2 text-left">Time</th>
                      <th className="px-6 py-2 text-left">Status</th>
                      <th className="px-6 py-2 text-left">Response</th>
                      <th className="px-6 py-2 text-left">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pings.slice(0, 20).map((p) => {
                      const meta = STATUS_META[p.status] || STATUS_META['UP'];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-6 py-2 whitespace-nowrap text-slate-600" title={formatDate(p.checkedAt)}>
                            {relativeTime(p.checkedAt)}
                          </td>
                          <td className="px-6 py-2"><span className={meta.cls}>{meta.label}</span></td>
                          <td className="px-6 py-2 text-slate-600">{p.responseTimeMs ?? '—'} ms</td>
                          <td className="px-6 py-2 text-slate-600">{p.statusCode ?? '—'}</td>
                        </tr>
                      );
                    })}
                    {pings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                          No pings recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}