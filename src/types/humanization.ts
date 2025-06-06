export type ModelType = 'ninja' | 'ghost' | 'generator';

export enum HumanizationLevel {
  Conservative = 1,
  Balanced = 5,
  Aggressive = 10
}

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
  | 'korean';

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