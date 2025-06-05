import { create } from 'zustand';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock successful login
      set({ 
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Demo User',
          email,
          avatar: 'https://i.pravatar.cc/150?u=demo'
        },
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error('Login failed');
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock successful login
      set({ 
        isAuthenticated: true,
        user: {
          id: '2',
          name: 'Google User',
          email: 'google@example.com',
          avatar: 'https://i.pravatar.cc/150?u=google'
        },
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error('Google login failed');
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock successful registration
      set({ 
        isAuthenticated: true,
        user: {
          id: '3',
          name,
          email,
          avatar: `https://i.pravatar.cc/150?u=${email}`
        },
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error('Registration failed');
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false
    });
  }
}));