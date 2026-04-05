import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set) => ({
  user:    null,
  token:   null,
  loading: true,

  init: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await authAPI.me();
        set({ user: res.data.user, token, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      localStorage.removeItem('token');
      set({ loading: false });
    }
  },

  login: async (identifier, password) => {
    const res = await authAPI.login({ identifier, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
