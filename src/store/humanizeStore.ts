import { create } from 'zustand';
import { ModelType, HumanizationLevel, SupportedLanguage, AIDetectionScore, HistoryItem } from '../types';
import { useUserPlanStore } from './userPlanStore';

type HumanizeState = {
  originalText: string;
  humanizedText: string;
  loading: boolean;
  model: ModelType;
  level: HumanizationLevel;
  language: SupportedLanguage;
  detectionScore: AIDetectionScore | null;
  history: HistoryItem[];
  
  setOriginalText: (text: string) => void;
  setModel: (model: ModelType) => void;
  setLevel: (level: HumanizationLevel) => void;
  setLanguage: (language: SupportedLanguage) => void;
  
  humanizeText: () => Promise<void>;
  checkDetection: () => Promise<void>;
  clearText: () => void;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'date'>) => void;
};

export const useHumanizeStore = create<HumanizeState>((set, get) => ({
  originalText: '',
  humanizedText: '',
  loading: false,
  model: 'ninja',
  level: 5,
  language: 'english',
  detectionScore: null,
  history: [],
  
  setOriginalText: (text: string) => set({ originalText: text }),
  setModel: (model: ModelType) => set({ model }),
  setLevel: (level: HumanizationLevel) => set({ level }),
  setLanguage: (language: SupportedLanguage) => set({ language }),
  
  humanizeText: async () => {
    const { originalText, model, level, language } = get();
    const wordCount = originalText.split(/\s+/).filter(Boolean).length;
    
    // Check word count against user's plan
    const userPlan = useUserPlanStore.getState().userPlan;
    
    if (wordCount > userPlan.maxWordsPerRequest) {
      throw new Error(`Your plan allows a maximum of ${userPlan.maxWordsPerRequest} words per request`);
    }
    
    if (wordCount > userPlan.wordsRemaining) {
      throw new Error(`You only have ${userPlan.wordsRemaining} words remaining in your plan`);
    }
    
    set({ loading: true });
    
    try {
      // Deduct words from the user's plan
      useUserPlanStore.getState().deductWords(wordCount);
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock humanization based on model and level
      let humanizedText = '';
      
      // Add slight variations based on model type
      switch (model) {
        case 'ninja':
          // Standard rewriting - light paraphrasing
          humanizedText = mockNinjaModel(originalText, level);
          break;
        case 'ghost':
          // Deep rewriting - more variations
          humanizedText = mockGhostModel(originalText, level);
          break;
        case 'generator':
          // Completely new but similar content
          humanizedText = mockGeneratorModel(originalText, level);
          break;
      }
      
      set({ 
        humanizedText,
        loading: false,
        detectionScore: null // Reset detection score for new content
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  checkDetection: async () => {
    const { humanizedText } = get();
    
    if (!humanizedText) {
      throw new Error('No humanized text to check');
    }
    
    set({ loading: true });
    
    try {
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock detection score (lower is better - less AI detection)
      const mockLevel = Math.random();
      let level: 'low' | 'medium' | 'high';
      
      if (mockLevel < 0.7) {
        level = 'low';
      } else if (mockLevel < 0.9) {
        level = 'medium';
      } else {
        level = 'high';
      }
      
      const detectionScore: AIDetectionScore = {
        score: Math.round(mockLevel * 100),
        level,
        detector: 'MockDetector'
      };
      
      set({ 
        detectionScore,
        loading: false
      });
      
      return detectionScore;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  clearText: () => set({ originalText: '', humanizedText: '', detectionScore: null }),
  
  addToHistory: (item) => set((state) => ({
    history: [
      {
        id: Date.now().toString(),
        date: new Date(),
        ...item
      },
      ...state.history
    ]
  }))
}));

// Mock model functions to simulate different types of text transformation
function mockNinjaModel(text: string, level: HumanizationLevel): string {
  // Simple word replacement for demo
  const variations = [
    { original: 'good', replacements: ['nice', 'great', 'excellent'] },
    { original: 'bad', replacements: ['poor', 'terrible', 'awful'] },
    { original: 'big', replacements: ['large', 'huge', 'enormous'] },
    { original: 'small', replacements: ['tiny', 'little', 'miniature'] },
    { original: 'happy', replacements: ['joyful', 'pleased', 'delighted'] },
    { original: 'sad', replacements: ['unhappy', 'depressed', 'gloomy'] },
    { original: 'important', replacements: ['crucial', 'essential', 'vital'] },
    { original: 'difficult', replacements: ['challenging', 'hard', 'tough'] },
  ];
  
  let result = text;
  
  // The higher the level, the more words we replace
  const replacementChance = level / 20; // 5% to 50% chance based on level 1-10
  
  variations.forEach(({ original, replacements }) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      return Math.random() < replacementChance 
        ? replacements[Math.floor(Math.random() * replacements.length)] 
        : match;
    });
  });
  
  return result;
}

function mockGhostModel(text: string, level: HumanizationLevel): string {
  // More extensive modifications for the Ghost model
  // First apply the Ninja model changes
  let result = mockNinjaModel(text, level);
  
  // Then restructure some sentences based on level
  const sentences = result.split(/(?<=[.!?])\s+/);
  let modifiedSentences = sentences.map((sentence, index) => {
    // Higher levels have more chance of sentence restructuring
    if (Math.random() < (level / 15)) { // 6.7% to 66.7% chance
      // Simple passive to active or vice versa transformation
      if (sentence.includes('was') || sentence.includes('were')) {
        // Crude passive-to-active transformation for demo
        return sentence.replace(/(was|were) (\w+ed) by/, '$2');
      } else if (sentence.length > 20 && !sentence.includes('was') && !sentence.includes('were')) {
        // Crude active-to-passive transformation for demo
        const words = sentence.split(' ');
        if (words.length > 5) {
          // Simulate passive voice transformation (very simplified)
          return `It was observed that ${sentence.toLowerCase()}`;
        }
      }
    }
    return sentence;
  });
  
  // Join sentences back together
  result = modifiedSentences.join(' ');
  
  // Add some natural language connectors if level is high enough
  if (level > 5) {
    const connectors = [
      'However, ', 'Nevertheless, ', 'In addition, ', 
      'Furthermore, ', 'Interestingly, ', 'Notably, '
    ];
    
    // Add connectors to some sentences
    modifiedSentences = result.split(/(?<=[.!?])\s+/).map((sentence, index) => {
      if (index > 0 && Math.random() < (level / 20)) {
        return connectors[Math.floor(Math.random() * connectors.length)] + sentence.toLowerCase();
      }
      return sentence;
    });
    
    result = modifiedSentences.join(' ');
  }
  
  return result;
}

function mockGeneratorModel(text: string, level: HumanizationLevel): string {
  // For the generator model, we'll create a completely new text that preserves
  // the core meaning but has different structure and wording
  
  // Extract key terms (simplified for demo)
  const words = text.split(/\s+/);
  const keyTerms = words.filter(word => 
    word.length > 4 && 
    !['about', 'above', 'across', 'after', 'against', 'around', 'because', 'before', 'behind', 'below', 'between', 'during', 'except', 'inside', 'outside', 'through', 'towards', 'under', 'within', 'without'].includes(word.toLowerCase())
  );
  
  // Templates for new content
  const templates = [
    "After considering the matter of {term1} and {term2}, I've come to realize that {term3} plays a crucial role in understanding the broader context of {term4}.",
    "Many experts in the field have discussed {term1} in relation to {term2}. However, we should also consider how {term3} affects our perception of {term4}.",
    "When examining {term1}, it's important to remember the significance of {term2}. This becomes even more relevant when we factor in {term3} and its impact on {term4}.",
    "The relationship between {term1} and {term2} has been studied extensively. What's often overlooked, though, is how {term3} contributes to the overall framework of {term4}.",
    "I've been thinking about {term1} lately, especially in terms of how it relates to {term2}. It's fascinating to consider the ways in which {term3} influences our understanding of {term4}."
  ];
  
  // Select random terms and template
  const selectedTerms = [];
  for (let i = 0; i < 4; i++) {
    if (keyTerms.length > 0) {
      const randomIndex = Math.floor(Math.random() * keyTerms.length);
      selectedTerms.push(keyTerms[randomIndex]);
      keyTerms.splice(randomIndex, 1);
    } else {
      selectedTerms.push('this concept');
    }
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Fill in the template
  let result = template
    .replace('{term1}', selectedTerms[0] || 'this topic')
    .replace('{term2}', selectedTerms[1] || 'related factors')
    .replace('{term3}', selectedTerms[2] || 'the situation')
    .replace('{term4}', selectedTerms[3] || 'the overall matter');
  
  // Add more content based on the level
  if (level > 3) {
    result += ` Furthermore, we should not underestimate the importance of context when discussing these matters.`;
  }
  
  if (level > 6) {
    result += ` As someone who has spent time considering these issues, I believe that a nuanced approach is necessary for a comprehensive understanding.`;
  }
  
  if (level > 8) {
    result += ` While there are no simple solutions, acknowledging the complexity of the situation is a step in the right direction.`;
  }
  
  return result;
}