import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: any;
  serverUrl: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: any) => void;
  setServerUrl: (url: string) => void;
  updateUser: (data: Partial<any>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      serverUrl: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setServerUrl: (url) => set({ serverUrl: url }),
      updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'opencommstack-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
