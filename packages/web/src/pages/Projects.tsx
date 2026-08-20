import { useEffect, useState } from 'react';
import { FolderKanban, GitBranch, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Project } from '@/types';
import { formatDate } from '@/lib/utils';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.get('/projects').then((r) => r.data.projects || r.data || []),
        api.get('/teams').then((r) => r.data.teams || r.data || []),
      ]);
      setProjects(p);
      setTeams(t);
      // Set initial teamId if not set yet, using the first available team
      if (t.length > 0) {
        setTeamId((prev) => prev || t[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      alert('Please select a team first');
      return;
    }
    try {
      await api.post('/projects', { name, description, teamId });
      setName('');
      setDescription('');
      setCreating(false);
      load();
    } catch (e: any) {
      const resp = e?.response?.data;
      // API returns { error: "...", details: [...] } on validation failure
      let msg = resp?.error || resp?.message || 'Failed to create project';
      if (resp?.details && Array.isArray(resp.details)) {
        msg = resp.details.map((x: any) => `${x.field}: ${x.message}`).join(', ');
      }
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Projects, repos and environments</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Project
        </button>
      </div>

      {creating && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Create new project</h3>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label">Project name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Team</label>
              <select required value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input">
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card p-5 hover:shadow-card-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <FolderKanban size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">
                      {p.team?.name || '—'} • {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              {p.description && (
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{p.description}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
<span className="inline-flex items-center gap-1">
  <GitBranch size={14} /> {p._count?.repos ?? p.repos?.length ?? 0} repos
</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full card p-12 text-center text-slate-500">
              No projects yet. Create one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
