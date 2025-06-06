import { create } from 'zustand';
import { PlanType, PLAN_FEATURES } from '../types';

// Add Clerk types
declare global {
  interface Window {
    Clerk: {
      user: Promise<{
        privateMetadata: Record<string, any>;
      } | null>;
    };
  }
}

interface UserPlanState {
  plan: PlanType;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  wordsRemaining: number;
  updatePlan: (plan: PlanType) => void;
  updateSubscription: (data: {
    subscriptionId: string;
    subscriptionStatus: string;
    currentPeriodEnd: string;
  }) => void;
  deductWords: (count: number) => void;
  resetWordCount: () => void;
  syncWithClerk: () => Promise<void>;
  getFeatures: () => {
    wordsPerDay: number;
    wordsPerRequest: number;
    hasAIDetection: boolean;
    modelsAvailable: string[];
    wordsRemaining: number;
  };
}

export const useUserPlanStore = create<UserPlanState>((set, get) => ({
  plan: 'free',
  subscriptionId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  wordsRemaining: PLAN_FEATURES.free.wordsPerDay,
  
  updatePlan: (plan) => set((state) => ({
    plan,
    wordsRemaining: PLAN_FEATURES[plan].wordsPerDay,
  })),
  
  updateSubscription: (data) => set(data),
  
  deductWords: (count) => set((state) => ({
    wordsRemaining: Math.max(0, state.wordsRemaining - count),
  })),
  
  resetWordCount: () => set((state) => ({
    wordsRemaining: PLAN_FEATURES[state.plan].wordsPerDay,
  })),
  
  syncWithClerk: async () => {
    try {
      if (!window.Clerk) {
        console.log('Clerk not initialized yet');
        return;
      }

      const user = await window.Clerk.user;
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Fetching user metadata from Clerk...');
      
      const privateMetadata = user.privateMetadata as {
        plan?: PlanType;
        subscriptionId?: string;
        subscriptionStatus?: string;
        currentPeriodEnd?: string;
      };

      console.log('Current user metadata:', privateMetadata);

      // Set default values if metadata is not present
      const plan = privateMetadata?.plan || 'free';
      const subscriptionId = privateMetadata?.subscriptionId || null;
      const subscriptionStatus = privateMetadata?.subscriptionStatus || null;
      const currentPeriodEnd = privateMetadata?.currentPeriodEnd || null;

      console.log('Setting user plan state:', {
        plan,
        subscriptionId,
        subscriptionStatus,
        currentPeriodEnd
      });

      set({
        plan,
        subscriptionId,
        subscriptionStatus,
        currentPeriodEnd,
        wordsRemaining: PLAN_FEATURES[plan].wordsPerDay,
      });

      console.log('Successfully updated user plan state');
    } catch (error) {
      console.error('Error syncing with Clerk:', error);
      throw error; // Re-throw to handle in the component
    }
  },
  
  getFeatures: () => {
    const state = get();
    return {
      ...PLAN_FEATURES[state.plan],
      wordsRemaining: state.wordsRemaining,
    };
  },
}));