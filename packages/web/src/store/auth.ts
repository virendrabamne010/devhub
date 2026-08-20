import { create } from 'zustand';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  restore: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user: User, token: string, refreshToken?: string) => {
    localStorage.setItem('devhub_token', token);
    localStorage.setItem('devhub_user', JSON.stringify(user));
    if (refreshToken) localStorage.setItem('devhub_refresh_token', refreshToken);
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('devhub_refresh_token');
    const token = localStorage.getItem('devhub_token');
    if (refreshToken && token) {
      try {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem('devhub_token');
    localStorage.removeItem('devhub_user');
    localStorage.removeItem('devhub_refresh_token');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },
  restore: () => {
    try {
      const token = localStorage.getItem('devhub_token');
      const userStr = localStorage.getItem('devhub_user');
      const refreshToken = localStorage.getItem('devhub_refresh_token');
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, refreshToken, isAuthenticated: true });
      } else {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      }
    } catch {
      localStorage.removeItem('devhub_token');
      localStorage.removeItem('devhub_user');
      localStorage.removeItem('devhub_refresh_token');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    }
  },
  hasRole: (roles: UserRole[]) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));