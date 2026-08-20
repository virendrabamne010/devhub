import { Fragment, useCallback, useEffect, useState } from 'react';
import { Rocket, Play, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import type { Deployment } from '@/types';
import { cn, formatDate, relativeTime } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: 'badge-success',
  IN_PROGRESS: 'badge-info',
  QUEUED: 'badge-warning',
  FAILED: 'badge-danger',
  CANCELLED: 'badge-slate',
};

export default function Deployments() {
  const [list, setList] = useState<Deployment[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pollMs] = useState(5000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (status !== 'all') params.status = status;
      const { data } = await api.get('/deployments', { params });
      setList(data.deployments || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [status, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll only when tab is visible
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(load, pollMs);
      }
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        load();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load, pollMs]);

  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerData, setTriggerData] = useState<{
    projects: any[];
    selectedProject: string;
    selectedRepo: string;
    selectedEnv: string;
  }>({ projects: [], selectedProject: '', selectedRepo: '', selectedEnv: '' });

  const loadTriggerData = async () => {
    try {
      const { data } = await api.get('/projects');
      const projects = data.projects || [];
      if (projects.length > 0) {
        const projDetail = await api.get(`/projects/${projects[0].id}`).then(r => r.data.project);
        setTriggerData({
          projects,
          selectedProject: projects[0].id,
          selectedRepo: projDetail.repos?.[0]?.id || '',
          selectedEnv: projDetail.environments?.[0]?.id || ''
        });
      }
      setShowTrigger(true);
    } catch (e) {
      alert('Failed to load projects');
    }
  };

  const handleProjectChange = async (projectId: string) => {
    try {
      const projDetail = await api.get(`/projects/${projectId}`).then(r => r.data.project);
      setTriggerData(prev => ({
        ...prev,
        selectedProject: projectId,
        selectedRepo: projDetail.repos?.[0]?.id || '',
        selectedEnv: projDetail.environments?.[0]?.id || ''
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const submitDeploy = async () => {
    if (!triggerData.selectedRepo || !triggerData.selectedEnv) return;
    try {
      const version = `v1.${Math.floor(Math.random() * 99)}.${Math.floor(Math.random() * 9)}`;
      await api.post('/deployments', {
        version,
        repositoryId: triggerData.selectedRepo,
        environmentId: triggerData.selectedEnv,
      });
      setShowTrigger(false);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to trigger deployment');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deployments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} total • Auto-refresh {pollMs / 1000}s
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="all">All statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={load} className="btn-outline">
            <RefreshCw size={16} className="mr-1" /> Refresh
          </button>
          <button onClick={loadTriggerData} className="btn-primary">
            <Play size={16} className="mr-1" /> Trigger Deploy
          </button>
        </div>
      </div>

      {showTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Trigger Deployment</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
                <select 
                  className="input w-full"
                  value={triggerData.selectedProject}
                  onChange={e => handleProjectChange(e.target.value)}
                >
                  {triggerData.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Repository ID</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={triggerData.selectedRepo}
                  onChange={e => setTriggerData(p => ({...p, selectedRepo: e.target.value}))}
                  placeholder="UUID"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Environment ID</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={triggerData.selectedEnv}
                  onChange={e => setTriggerData(p => ({...p, selectedEnv: e.target.value}))}
                  placeholder="UUID"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowTrigger(false)} className="btn-outline">Cancel</button>
                <button 
                  onClick={submitDeploy} 
                  disabled={!triggerData.selectedRepo || !triggerData.selectedEnv}
                  className="btn-primary"
                >
                  Deploy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 w-10"></th>
                  <th className="px-6 py-3">Version</th>
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Environment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Initiated by</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                      No deployments found.
                    </td>
                  </tr>
                )}
                {list.map((d) => {
                  const isOpen = expanded === d.id;
                  const duration =
                    d.startedAt && d.completedAt
                      ? `${((new Date(d.completedAt).getTime() - new Date(d.startedAt).getTime()) / 1000).toFixed(0)}s`
                      : '—';
                  return (
                    <Fragment key={d.id}>
                      <tr
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpanded(isOpen ? null : d.id)}
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 font-mono text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <Rocket size={14} className="text-brand-500" />
                            {d.version}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-slate-700">
                          {d.project?.name || '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span className="badge-slate">{d.environment?.name || '—'}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span className={cn(STATUS_STYLES[d.status] || 'badge-slate')}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                          {d.initiatedBy?.name || 'System'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-slate-500" title={formatDate(d.createdAt)}>
                          {relativeTime(d.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-slate-500">{duration}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td></td>
                          <td colSpan={7} className="px-6 pb-6">
                            <div className="rounded-md border border-slate-200 bg-white p-4">
                              <h4 className="mb-2 text-sm font-semibold text-slate-900">Logs</h4>
                              <pre className="max-h-72 overflow-auto rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 whitespace-pre-wrap">
                                {d.logs || '[No logs available yet]'}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-sm">
            <div className="text-slate-500">
              Showing page {page} of {totalPages} ({total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn-outline"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="btn-outline"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
