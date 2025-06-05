import { create } from 'zustand';
import { PlanType, UserPlan, ModelType } from '../types';

type UserPlanState = {
  userPlan: UserPlan;
  updatePlan: (plan: PlanType) => void;
  deductWords: (count: number) => void;
  resetWordCount: () => void;
};

export const useUserPlanStore = create<UserPlanState>((set) => ({
  userPlan: {
    plan: 'free',
    wordsRemaining: 1000,
    maxWordsPerRequest: 500,
    modelsAvailable: ['ninja'],
    hasAIDetection: false,
  },

  updatePlan: (plan: PlanType) => set((state) => {
    const newPlan = { ...state.userPlan, plan };
    
    // Update plan-specific values
    switch (plan) {
      case 'free':
        newPlan.wordsRemaining = 1000;
        newPlan.maxWordsPerRequest = 500;
        newPlan.modelsAvailable = ['ninja'];
        newPlan.hasAIDetection = false;
        break;
      case 'basic':
        newPlan.wordsRemaining = 10000;
        newPlan.maxWordsPerRequest = 2000;
        newPlan.modelsAvailable = ['ninja', 'ghost'];
        newPlan.hasAIDetection = true;
        break;
      case 'pro':
        newPlan.wordsRemaining = 50000;
        newPlan.maxWordsPerRequest = 5000;
        newPlan.modelsAvailable = ['ninja', 'ghost', 'generator'];
        newPlan.hasAIDetection = true;
        break;
      case 'enterprise':
        newPlan.wordsRemaining = 250000;
        newPlan.maxWordsPerRequest = 10000;
        newPlan.modelsAvailable = ['ninja', 'ghost', 'generator'];
        newPlan.hasAIDetection = true;
        break;
    }
    
    return { userPlan: newPlan };
  }),

  deductWords: (count: number) => set((state) => ({
    userPlan: {
      ...state.userPlan,
      wordsRemaining: Math.max(0, state.userPlan.wordsRemaining - count)
    }
  })),

  resetWordCount: () => set((state) => ({
    userPlan: {
      ...state.userPlan,
      wordsRemaining: state.userPlan.plan === 'free' ? 1000 :
                      state.userPlan.plan === 'basic' ? 10000 :
                      state.userPlan.plan === 'pro' ? 50000 : 250000
    }
  }))
}));