import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format. Expected format: https://<project>.supabase.co');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  }
});

// Types
export interface UserProfile {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  subscription_id?: string;
  subscription_status?: string;
  current_period_end?: string;
  words_remaining: number;
}

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;

  // Create or update a profile for the new user
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: data.user.email,
          plan: 'free',
          words_remaining: 2000 // Default free plan limit
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (profileError) throw profileError;
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Profile management
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') {
      const user = await getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          plan: 'free',
          words_remaining: 2000
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }
    throw error;
  }
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Subscription management
export const updateSubscription = async (
  userId: string,
  subscriptionId: string,
  status: string,
  currentPeriodEnd: string
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      plan: status === 'active' ? 'pro' : 'free',
      subscription_id: subscriptionId,
      subscription_status: status,
      current_period_end: currentPeriodEnd,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}; 