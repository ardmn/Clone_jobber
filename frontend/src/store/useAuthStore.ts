import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/auth/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  initialize: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();

    set({
      user,
      isAuthenticated,
      isLoading: false,
    });
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
