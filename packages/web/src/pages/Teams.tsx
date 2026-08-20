
import { useEffect, useState } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import type { Team } from '@/types';
import { formatDate } from '@/lib/utils';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teams');
      setTeams(data.teams || data || []);
    } catch (e: any) {
      const resp = e?.response?.data;
      setError(resp?.error || resp?.message || e?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teams', { name, description });
      setName('');
      setDescription('');
      setCreating(false);
      load();
    } catch (e: any) {
      const resp = e?.response?.data;
      // API returns { error: "...", details: [...] } on validation failure
      let msg = resp?.error || resp?.message || 'Failed to create team';
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
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your organization&apos;s teams</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Team
        </button>
      </div>

      {creating && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Create new team</h3>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label">Team name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className="btn-primary">Create Team</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">
                      {t.members?.length ?? 0} members • Created {formatDate(t.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              {t.description && (
                <p className="mt-3 text-sm text-slate-600">{t.description}</p>
              )}
              {t.members && t.members.length > 0 && (
                <div className="mt-4 flex -space-x-2">
                  {t.members.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      title={m.user?.name || m.userId}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-xs font-semibold text-white"
                    >
                      {(m.user?.name || 'U')
                        .split(' ')
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  ))}
                  {t.members.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-700">
                      +{t.members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {teams.length === 0 && (
            <div className="col-span-full card p-12 text-center text-slate-500">
              <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
              No teams yet. Create your first team above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
