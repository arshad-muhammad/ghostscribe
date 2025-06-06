export type PlanType = 'free' | 'pro';

export interface PlanFeatures {
  wordsPerDay: number;
  wordsPerRequest: number;
  hasAIDetection: boolean;
  modelsAvailable: string[];
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    wordsPerDay: 1000,
    wordsPerRequest: 500,
    hasAIDetection: false,
    modelsAvailable: ['ninja'],
  },
  pro: {
    wordsPerDay: 250000,
    wordsPerRequest: 10000,
    hasAIDetection: true,
    modelsAvailable: ['ninja', 'ghost', 'generator'],
  },
}; 