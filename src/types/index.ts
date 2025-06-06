export * from './humanization';

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

export type UserPlan = {
  plan: PlanType;
  wordsRemaining: number;
  maxWordsPerRequest: number;
  modelsAvailable: ModelType[];
  hasAIDetection: boolean;
};

export type ModelType = 'ninja' | 'ghost' | 'generator';

export type HumanizationLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SupportedLanguage = 'english' | 'spanish' | 'french' | 'german' | 'hindi';

export type AIDetectionScore = {
  score: number;
  level: 'low' | 'medium' | 'high';
  detector: string;
};

export type HistoryItem = {
  id: string;
  date: Date;
  originalText: string;
  humanizedText: string;
  model: ModelType;
  level: HumanizationLevel;
  wordCount: number;
  detectionScore?: AIDetectionScore;
};

export type PricingPlan = {
  name: string;
  type: PlanType;
  price: number;
  billing: 'monthly' | 'annually';
  description: string;
  wordsPerDay: number;
  maxWordsPerRequest: number;
  features: string[];
  models: ModelType[];
  hasAIDetection: boolean;
  recommended?: boolean;
};

export type TestimonialType = {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatarUrl?: string;
};

export type FeatureType = {
  title: string;
  description: string;
  icon: React.ComponentType;
};