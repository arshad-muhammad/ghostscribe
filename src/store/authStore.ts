import { create } from 'zustand';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle, 
  getCurrentUser,
  getUserProfile,
  UserProfile
} from '../utils/supabase';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      const { user } = await signIn(email, password);
      if (!user) throw new Error('No user returned from login');
      
      const profile = await getUserProfile(user.id);
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      const { user } = await signUp(email, password);
      if (!user) throw new Error('No user returned from registration');
      
      const profile = await getUserProfile(user.id);
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      await signInWithGoogle();
      
      // Wait for the redirect and then get the user
      const user = await getCurrentUser();
      if (!user) throw new Error('No user returned from Google login');
      
      const profile = await getUserProfile(user.id);
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Google login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  logout: async () => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      await signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false
      });
      throw error;
    }
  },

  checkAuth: async () => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true, error: null });
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        set({ user: profile, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));