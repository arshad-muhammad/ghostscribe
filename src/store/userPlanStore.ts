import { create } from 'zustand';
import { supabase, getUserProfile } from '../utils/supabase';

interface PlanFeatures {
  wordsPerRequest: number;
  wordsRemaining: number;
  hasAIDetection: boolean;
  hasAdvancedModels: boolean;
}

interface UserPlanState {
  plan: 'free' | 'pro';
  wordsRemaining: number;
  subscriptionStatus: string | undefined;
  currentPeriodEnd?: string;
  isLoading: boolean;
  error: string | null;
  checkPlanStatus: () => Promise<void>;
  getFeatures: () => PlanFeatures;
  deductWords: (wordCount: number) => Promise<void>;
}

export const useUserPlanStore = create<UserPlanState>((set, get) => ({
  plan: 'free',
  wordsRemaining: 2000,
  subscriptionStatus: undefined,
  currentPeriodEnd: undefined,
  isLoading: false,
  error: null,

  checkPlanStatus: async () => {
    try {
      console.log('Checking plan status...');
      set({ isLoading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, setting default values');
        set({ 
          plan: 'free',
          wordsRemaining: 2000,
          subscriptionStatus: undefined,
          currentPeriodEnd: undefined,
          isLoading: false 
        });
        return;
      }

      console.log('Session found, fetching profile for user:', session.user.id);
      const profile = await getUserProfile(session.user.id);

      console.log('Profile data:', {
        plan: profile.plan,
        wordsRemaining: profile.words_remaining,
        subscriptionStatus: profile.subscription_status,
        currentPeriodEnd: profile.current_period_end,
        userId: profile.id
      });

      // Ensure we have valid data
      const updatedState = {
        plan: profile.plan || 'free',
        wordsRemaining: profile.words_remaining || 2000,
        subscriptionStatus: profile.subscription_status,
        currentPeriodEnd: profile.current_period_end,
        isLoading: false,
        error: null
      };

      console.log('Updating store with:', updatedState);
      set(updatedState);

    } catch (error) {
      console.error('Error fetching plan status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch plan status',
        isLoading: false,
        plan: 'free',
        wordsRemaining: 2000,
        subscriptionStatus: undefined,
        currentPeriodEnd: undefined
      });
    }
  },

  getFeatures: () => {
    const state = get();
    const isPro = state.plan === 'pro';

    return {
      wordsPerRequest: isPro ? 10000 : 500,
      wordsRemaining: state.wordsRemaining,
      hasAIDetection: isPro,
      hasAdvancedModels: isPro
    };
  },

  deductWords: async (wordCount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newWordsRemaining = Math.max(0, get().wordsRemaining - wordCount);

      const { error } = await supabase
        .from('profiles')
        .update({ words_remaining: newWordsRemaining })
        .eq('id', session.user.id);

      if (error) throw error;

      set({ wordsRemaining: newWordsRemaining });
    } catch (error) {
      console.error('Error deducting words:', error);
      throw error;
    }
  }
}));