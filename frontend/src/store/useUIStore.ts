import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  pageTitle: string;
  setPageTitle: (title: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),

  theme: 'light',

  setTheme: (theme) =>
    set({
      theme,
    }),

  pageTitle: '',

  setPageTitle: (title) =>
    set({
      pageTitle: title,
    }),
}));
