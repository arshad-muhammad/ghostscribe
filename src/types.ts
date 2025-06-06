export type PlanType = 'free' | 'pro';

export interface PlanFeatures {
  wordsPerDay: number;
  wordsPerRequest: number;
  hasAIDetection: boolean;
  modelsAvailable: string[];
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    wordsPerDay: 2000,
    wordsPerRequest: 500,
    hasAIDetection: false,
    modelsAvailable: ['ninja'],
  },
  pro: {
    wordsPerDay: 5000,
    wordsPerRequest: 10000,
    hasAIDetection: true,
    modelsAvailable: ['ninja', 'ghost', 'generator'],
  },
};

export type ModelType = 'ninja' | 'ghost' | 'generator';

// Humanization level enum for use in the application
export enum HumanizationLevel {
  Conservative = 1,
  Balanced = 5,
  Aggressive = 10
}

// Type for all possible humanization level values
export type HumanizationLevelValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SupportedLanguage = 
  | 'english' 
  | 'spanish' 
  | 'french' 
  | 'german' 
  | 'italian' 
  | 'portuguese' 
  | 'dutch' 
  | 'russian' 
  | 'chinese' 
  | 'japanese' 
  | 'korean'
  | 'hindi';

export type AIDetectionScore = {
  score: number;  // 0-100
  level: 'low' | 'medium' | 'high';
  detector: string;
};

export type HistoryItem = {
  id: string;
  date: Date;
  originalText: string;
  humanizedText: string;
  model: ModelType;
  level: HumanizationLevelValue;
  language: SupportedLanguage;
  detectionScore?: AIDetectionScore;
};

// AI Detection Service Response Types
export interface ZeroGPTResponse {
  score: number;  // 0-1
  confidence: number;
  details?: {
    humanLikeness: number;
    coherence: number;
    complexity: number;
  };
}

export interface GPTZeroResponse {
  score: number;  // 0-100
  probability: number;
  classification: string;
  metrics?: {
    perplexity: number;
    burstiness: number;
  };
}

export interface FeatureType {
  title: string;
  description: string;
  icon: React.ComponentType;
  available: boolean;
}

export interface TestimonialType {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
} 