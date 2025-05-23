import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../utils/api';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/users/login', { email, password });
          const { user, token } = response.data;
          set({ 
            user, 
            token,
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.details?.[0]?.msg ||
                              error.message || 
                              'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          throw error; // Re-throw for component handling
        }
      },
      
      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/users/register', { username, email, password });
          const { user, token } = response.data;
          set({ 
            user, 
            token,
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.details?.[0]?.msg ||
                              error.message || 
                              'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          throw error; // Re-throw for component handling
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'user-storage',
    }
  )
);

export default useUserStore;