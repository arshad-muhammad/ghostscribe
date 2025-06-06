import { supabase } from './supabase';
import type { AuthResponse } from '../types';

export const register = async (email: string, password: string): Promise<AuthResponse | null> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    return null;
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
    }
  };
};

export const loginWithGoogle = async (): Promise<AuthResponse | null> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth/callback'
    }
  });

  if (error) {
    throw error;
  }

  // Google OAuth will redirect, so we don't have user data immediately
  return null;
}; 