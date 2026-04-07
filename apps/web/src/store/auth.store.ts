import { create } from 'zustand';
import { api } from '../config/api';

interface User { id: string; email: string; name: string; phone?: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('cf_token'),
  isAuthenticated: !!localStorage.getItem('cf_token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cf_token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('cf_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('cf_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
