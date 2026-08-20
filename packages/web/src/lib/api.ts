import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tracks an in-flight refresh request so multiple 401s share a single call.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('devhub_refresh_token');
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken }, { timeout: 15000 });
    const newToken: string | undefined = data?.token;
    const newRefresh: string | undefined = data?.refreshToken;
    if (newToken) {
      localStorage.setItem('devhub_token', newToken);
      if (newRefresh) {
        localStorage.setItem('devhub_refresh_token', newRefresh);
      }
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem('devhub_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage access issues in privacy-restricted environments.
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Only attempt refresh once per request, on a 401, when a refresh token exists.
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = tryRefreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    // Only hard-logout for genuine auth failures, not for e.g. a 401 on login.
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('devhub_token');
      localStorage.removeItem('devhub_refresh_token');
      localStorage.removeItem('devhub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
