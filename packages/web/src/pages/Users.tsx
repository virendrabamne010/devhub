import { useEffect, useState } from 'react';
import { UserCog2, Shield, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User, UserRole } from '@/types';
import { cn, formatDate } from '@/lib/utils';

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  DEVELOPER: 'Developer',
  VIEWER: 'Viewer',
};

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: 'badge-danger',
  MANAGER: 'badge-info',
  DEVELOPER: 'badge-success',
  VIEWER: 'badge-slate',
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const hasRole = useAuthStore((s) => s.hasRole);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (userId: string, role: UserRole) => {
    try {
      await api.patch(`/users/${userId}`, { role });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to update role');
    }
  };

  const isAdmin = hasRole(['ADMIN']);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            {users.length} registered users • {isAdmin ? 'You can manage roles' : 'View-only (requires ADMIN)'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserCog2 size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Admins</p>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter((u) => u.role === 'ADMIN').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Developers</p>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter((u) => u.role === 'DEVELOPER').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => {
                  const initials = (u.name || 'U')
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className={cn('hover:bg-slate-50', isSelf && 'bg-brand-50/40')}>
                      <td className="whitespace-nowrap px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {u.name}
                              {isSelf && <span className="ml-2 badge-info">You</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-slate-600">{u.email}</td>
                      <td className="whitespace-nowrap px-6 py-3">
                        {isAdmin && !isSelf ? (
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                            className="input w-auto py-1.5 text-xs"
                          >
                            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={ROLE_COLOR[u.role]}>{ROLE_LABEL[u.role]}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
