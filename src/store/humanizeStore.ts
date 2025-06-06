import { create } from 'zustand';
import { 
  ModelType, 
  HumanizationLevel, 
  HumanizationLevelValue, 
  SupportedLanguage, 
  AIDetectionScore, 
  HistoryItem 
} from '../types';
import { useUserPlanStore } from './userPlanStore';
import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

// Initialize Gemini AI with proper configuration
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
console.log('API Key available:', !!apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

// Temperature settings for different humanization levels
const getTemperatureForLevel = (level: HumanizationLevelValue): number => {
  // Higher levels allow for more creative variations
  return 0.3 + (level * 0.07); // Range: 0.37 - 1.0
};

// Get top_p value based on humanization level
const getTopPForLevel = (level: HumanizationLevelValue): number => {
  // Start with more focused sampling for conservative levels
  const baseTopP = 0.7;
  const levelMultiplier = level * 0.04;
  return Math.min(0.95, baseTopP + levelMultiplier);
};

// Get top_k value based on humanization level
const getTopKForLevel = (level: HumanizationLevelValue): number => {
  // Higher values allow more diverse word choices
  return Math.min(40 + (level * 5), 80);
};

// Enhanced AI Detection Patterns
const AI_PATTERNS = {
  // Basic Patterns
  repetitive_phrases: /\b(\w+\s+\w+\s+\w+)\b.*\1/gi,
  common_ai_phrases: /\b(as an ai|as a language model|i apologize|i cannot|i do not have|i am not able|it is important to note|it is worth mentioning)\b/gi,
  uniform_sentence_length: /^[^.!?]{50,70}[.!?]\s+[^.!?]{50,70}[.!?]/gm,
  mechanical_transitions: /\b(furthermore|moreover|additionally|consequently|in conclusion|in summary|to summarize|in other words)\b/gi,
  overused_hedging: /\b(might|may|could|possibly|potentially|perhaps|probably|generally|typically|usually|often|sometimes)\b/gi,
  
  // Advanced Patterns
  formal_stiffness: /\b(it is|there are|this is|these are)\b.*\b(that|which|who)\b/gi,
  passive_voice: /\b(am|is|are|was|were|be|been|being)\s+\w+ed\b/gi,
  list_patterns: /(?:\d+\.\s+.*\n){3,}/g,
  redundant_qualifiers: /\b(very|really|quite|extremely|absolutely|literally|actually|basically|virtually)\b/gi,
  academic_phrases: /\b(in the context of|with respect to|in terms of|in light of|as a function of|in the field of|in the realm of)\b/gi,
  
  // Structural Patterns
  bullet_points: /(?:^|\n)[-•*]\s+.+(?:\n[-•*]\s+.+){2,}/gm,
  numbered_sequences: /(?:^|\n)\d+\.\s+.+(?:\n\d+\.\s+.+){2,}/gm,
  systematic_formatting: /(?:^|\n)(?:[A-Z][^.!?]+[.!?]\s*){3,}/gm,
  
  // Statistical Patterns
  repeated_sentence_starts: /(?:^|\n)(?:The|This|These|Those|It|They)\b.*?[.!?]\s+(?:The|This|These|Those|It|They)\b/gm,
  consistent_punctuation: /(?:[^.!?]+[.]\s+){5,}/g,
  
  // Semantic Patterns
  generic_conclusions: /\b(in conclusion|to conclude|finally|lastly|to sum up|in summary|to summarize)\b.*$/gmi,
  overused_transitions: /\b(however|nevertheless|nonetheless|on the other hand|conversely|similarly|likewise|in contrast|despite this)\b/gi,
  formulaic_phrases: /\b(it goes without saying|needless to say|it should be noted|it is crucial to|it is essential to|plays a crucial role|plays a vital role)\b/gi
};

// Text Analysis Types
type TextMetrics = {
  averageSentenceLength: number;
  sentenceLengthVariance: number;
  wordFrequencies: { [key: string]: number };
  uniqueWordsRatio: number;
  punctuationDistribution: { [key: string]: number };
  paragraphLengths: number[];
  readabilityScore: number;
  lexicalDensity: number;
};

type StyleMetrics = {
  passiveVoiceRatio: number;
  transitionDensity: number;
  formalityScore: number;
  sentenceVariety: number;
  vocabularyComplexity: number;
};

interface HumanizeState {
  originalText: string;
  humanizedText: string;
  loading: boolean;
  model: ModelType;
  level: HumanizationLevelValue;
  language: SupportedLanguage;
  detectionScore: AIDetectionScore | null;
  history: HistoryItem[];
  text: string;
  isProcessing: boolean;
  result: string | null;
  error: string | null;
  
  setOriginalText: (text: string) => void;
  setModel: (model: ModelType) => void;
  setLevel: (level: HumanizationLevelValue) => void;
  setLanguage: (language: SupportedLanguage) => void;
  
  humanizeText: () => Promise<void>;
  checkDetection: () => Promise<void>;
  clearText: () => void;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'date'>) => void;
  setText: (text: string) => void;
  countSyllables: (word: string) => number;
}

export const useHumanizeStore = create<HumanizeState>((set, get) => ({
  originalText: '',
  humanizedText: '',
  loading: false,
  model: 'ninja',
  level: 5 as HumanizationLevelValue, // Default to balanced level
  language: 'english',
  detectionScore: null,
  history: [],
  text: '',
  isProcessing: false,
  result: null,
  error: null,
  
  setOriginalText: (text: string) => set({ originalText: text }),
  setModel: (model: ModelType) => set({ model }),
  setLevel: (level: HumanizationLevelValue) => set({ level }),
  setLanguage: (language: SupportedLanguage) => set({ language }),
  
  humanizeText: async () => {
    const { originalText, model: modelType, level, language } = get();
    const wordCount = originalText.split(/\s+/).filter(Boolean).length;
    
    // Check word count against user's plan
    const features = useUserPlanStore.getState().getFeatures();
    
    if (wordCount > features.wordsPerRequest) {
      throw new Error(`Your plan allows a maximum of ${features.wordsPerRequest} words per request`);
    }
    
    if (wordCount > features.wordsRemaining) {
      throw new Error(`You only have ${features.wordsRemaining} words remaining in your plan`);
    }
    
    set({ loading: true });
    
    try {
      // Deduct words from the user's plan
      await useUserPlanStore.getState().deductWords(wordCount);
      
      // Generate system prompt based on model and level
      const prompt = generateSystemPrompt(modelType, level, language);
      
      try {
        console.log('Initializing Gemini model...');
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            temperature: getTemperatureForLevel(level),
            topP: getTopPForLevel(level),
            topK: getTopKForLevel(level),
            maxOutputTokens: Math.max(wordCount * 4, 1000), // Ensure enough tokens for natural variation
            stopSequences: [], // Allow natural completion
          },
        });

        console.log('Preparing prompt...');
        const fullPrompt = `${prompt}\n\nOriginal text:\n${originalText}\n\nPlease provide the rewritten version:`;

        console.log('Generating content...');
        let result: GenerateContentResult;
        try {
          result = await model.generateContent(fullPrompt);
          console.log('Content generated successfully');
        } catch (genError) {
          console.error('Generation error:', genError);
          throw new Error('Failed to generate content. Please try again with different text or settings.');
        }

        if (!result.response) {
          throw new Error('No response received from the model');
        }

        const response = result.response;
        console.log('Response received');
        
        const humanizedText = response.text();
        console.log('Text extracted, length:', humanizedText?.length);
        
        if (!humanizedText || humanizedText.trim().length === 0) {
          throw new Error('Generated text is empty');
        }
        
        set({ 
          humanizedText,
          loading: false,
          detectionScore: null // Reset detection score for new content
        });

        // Add to history
        get().addToHistory({
          originalText,
          humanizedText,
          model: modelType,
          level,
          language
        });

      } catch (apiError: unknown) {
        const error = apiError as Error;
        console.error('Gemini API error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Provide more specific error messages based on the error
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your API key in the Google Cloud Console.');
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error('Please enable the Gemini API in your Google Cloud Console and ensure you have billing set up.');
        } else if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later or check your quota limits.');
        } else {
          throw new Error(`Failed to generate text: ${error.message}`);
        }
      }

    } catch (error) {
      set({ loading: false });
      console.error('Humanization error:', error);
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
      // Perform local AI detection analysis
      const score = await performLocalAIDetection(humanizedText);
      
      const detectionScore: AIDetectionScore = {
        score,
        level: getDetectionLevel(score),
        detector: 'Local Analysis'
      };
      
      set({ 
        detectionScore,
        loading: false
      });
      
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
      ...state.history.slice(0, 49) // Keep last 50 items
    ]
  })),
  
  setText: (text: string) => set({ text }),
  
  countSyllables: (word: string): number => {
    const matches = word.toLowerCase().match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
  }
}));

// Helper functions for text humanization
const getLanguageGuidelines = (language: SupportedLanguage): string => {
  const guidelines = {
    english: `Language-Specific Guidelines:
      - Use natural English word order
      - Maintain proper subject-verb agreement
      - Use appropriate articles (a, an, the)`,
    spanish: `Language-Specific Guidelines:
      - Use proper gender agreement
      - Apply correct verb conjugations
      - Include necessary articles`,
    french: `Language-Specific Guidelines:
      - Maintain proper gender agreement
      - Use correct verb tenses
      - Apply liaison rules`,
    german: `Language-Specific Guidelines:
      - Follow verb-second word order
      - Use proper case declensions
      - Capitalize nouns`,
    italian: `Language-Specific Guidelines:
      - Apply proper gender and number agreement
      - Use correct verb conjugations
      - Follow adjective placement rules`,
    portuguese: `Language-Specific Guidelines:
      - Use appropriate verb tenses
      - Apply gender agreement
      - Include necessary articles`,
    dutch: `Language-Specific Guidelines:
      - Follow V2 word order
      - Use proper verb forms
      - Apply gender rules`,
    russian: `Language-Specific Guidelines:
      - Use correct case endings
      - Apply proper aspect
      - Follow word order rules`,
    chinese: `Language-Specific Guidelines:
      - Use proper measure words
      - Follow topic-comment structure
      - Apply correct word order`,
    japanese: `Language-Specific Guidelines:
      - Use appropriate particles
      - Follow SOV word order
      - Apply proper honorifics`,
    korean: `Language-Specific Guidelines:
      - Use proper honorifics
      - Follow SOV word order
      - Apply correct particles`,
    hindi: `Language-Specific Guidelines:
      - Use proper gender agreement
      - Follow SOV word order
      - Apply correct postpositions`
  };
  return guidelines[language] || '';
};

const generateSystemPrompt = (model: ModelType, level: HumanizationLevelValue, language: SupportedLanguage): string => {
  const basePrompt = `You are an expert writer who specializes in making text feel completely natural and human-written. Your task is to rewrite the given text without changing meaning but making it human-written while:

1. Core Writing Approach:
   - Write as if these are written by a human being
   - Show natural progression

2. Structural Elements:
   - Vary sentence length and structure randomly
   - Mix simple and complex sentences unpredictably
   - Use natural paragraph breaks
   - Add parenthetical thoughts and asides
   - Include casual digressions where appropriate

3. Language Patterns:
   - Mix vocabulary levels throughout
   - Use punctuation in a natural, unstructured way

4. Human Characteristics:
   - Show occasional uncertainty or reflection
   - Include natural self-corrections
   - Add relevant personal examples
   - Use imperfect but natural transitions
   - Show authentic emotion or reaction

5. Anti-Detection Techniques:
   - Avoid repetitive sentence structures
   - Break up any obvious patterns
   - Use irregular formatting naturally
   - Include occasional typos or common mistakes
   - Vary writing style throughout
   - Don't use academic or formal transitions
   - Avoid starting consecutive sentences similarly

Remember: Write as if you're naturally rewriting these texts in your own words like a human not like AI.`;

  const modelSpecific = {
    ninja: `Focus on making the text completely undetectable:
- Add subtle personal touches and natural imperfections
- Use organic flow and rhythm
- Include natural language patterns
- Vary writing style unpredictably`,
    ghost: `Maintain the message while adding authenticity:
- Keep the core ideas but express them personally
- Add natural variations and human elements
- Use relatable examples and experiences
- Make it feel genuinely human-written`,
    generator: `Transform the text with creative human elements:
- Add unique perspectives and insights
- Use natural storytelling techniques
- Include real-world analogies
- Make it engaging and relatable`
  }[model];

  const levelAdjustments = {
    1: "Make minimal changes while adding subtle human elements",
    2: "Add slight personal touches and natural variations",
    3: "Include some human elements and personal insights",
    4: "Balance formality with natural human writing patterns",
    5: "Add moderate personal elements and natural variations",
    6: "Include more personal examples and natural flow",
    7: "Add significant personal touches and human elements",
    8: "Use more informal language and personal experiences",
    9: "Include extensive personal elements and natural variations",
    10: "Transform completely while maintaining core message"
  }[level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10] || "Add natural variations appropriate to the level";

  const languageGuidelines = getLanguageGuidelines(language);

  // Helper function to count syllables
  const countSyllables = (word: string): number => {
    const matches = word.toLowerCase().match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
  };

  return `${basePrompt}

${modelSpecific}

Level-Specific Guidance:
${levelAdjustments}

${languageGuidelines}

IMPORTANT:
- Never mention this is a rewrite
- Keep the core message intact
- Make it feel completely natural
- Avoid any AI-like patterns

Now, rewrite the following text as if its written by a human:`;
};

async function performLocalAIDetection(text: string): Promise<number> {
  // Initialize score components
  let totalScore = 0;
  const weights = {
    // Pattern-based detection (50% total)
    repetitivePhrasesWeight: 8,
    commonAiPhrasesWeight: 7,
    uniformSentenceLengthWeight: 5,
    mechanicalTransitionsWeight: 5,
    overusedHedgingWeight: 5,
    formalStiffnessWeight: 5,
    passiveVoiceWeight: 5,
    listPatternsWeight: 5,
    redundantQualifiersWeight: 5,
    
    // Statistical analysis (25% total)
    textMetricsWeight: 15,
    styleMetricsWeight: 10,
    
    // Semantic analysis (25% total)
    semanticCoherenceWeight: 15,
    naturalLanguageWeight: 10
  } as const;

  // 1. Pattern-based Detection
  const patternScores = await calculatePatternScores(text);
  Object.entries(patternScores).forEach(([pattern, score]) => {
    const weightKey = `${pattern}Weight` as keyof typeof weights;
    if (weightKey in weights) {
      totalScore += score * weights[weightKey];
    }
  });

  // 2. Statistical Analysis
  const textMetrics = await calculateTextMetrics(text);
  const styleMetrics = await calculateStyleMetrics(text);
  
  const textMetricsScore = calculateMetricsScore(textMetrics);
  const styleMetricsScore = calculateStyleScore(styleMetrics);
  
  totalScore += textMetricsScore * weights.textMetricsWeight;
  totalScore += styleMetricsScore * weights.styleMetricsWeight;

  // 3. Semantic Analysis
  const semanticScore = await performSemanticAnalysis(text);
  const naturalLanguageScore = calculateNaturalLanguageScore(text, textMetrics, styleMetrics);
  
  totalScore += semanticScore * weights.semanticCoherenceWeight;
  totalScore += naturalLanguageScore * weights.naturalLanguageWeight;

  // Calculate final weighted score (0-100)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const finalScore = Math.round(totalScore / totalWeight);

  return Math.min(100, Math.max(0, finalScore));
}

async function calculatePatternScores(text: string): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};
  
  // Calculate scores for each pattern
  for (const [patternName, pattern] of Object.entries(AI_PATTERNS)) {
    const matches = (text.match(pattern) || []).length;
    const textLength = text.length;
    
    // Normalize score based on text length and pattern type
    let score = 0;
    switch (patternName) {
      case 'repetitive_phrases':
        score = Math.min(100, (matches / (textLength / 500)) * 100);
        break;
      case 'common_ai_phrases':
        score = Math.min(100, matches * 20);
        break;
      default:
        score = Math.min(100, (matches / (textLength / 1000)) * 100);
    }
    
    scores[patternName] = score;
  }
  
  return scores;
}

async function calculateTextMetrics(text: string): Promise<TextMetrics> {
  const sentences = text.split(/[.!?]+/);
  const words = text.split(/\s+/);
  const paragraphs = text.split(/\n\s*\n/);
  
  // Calculate average sentence length and variance
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const averageSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const sentenceLengthVariance = calculateVariance(sentenceLengths);
  
  // Calculate word frequencies and unique words ratio
  const wordFrequencies: { [key: string]: number } = {};
  words.forEach(word => {
    wordFrequencies[word.toLowerCase()] = (wordFrequencies[word.toLowerCase()] || 0) + 1;
  });
  const uniqueWordsRatio = Object.keys(wordFrequencies).length / words.length;
  
  // Calculate punctuation distribution
  const punctuationDistribution: { [key: string]: number } = {};
  const punctuation = text.match(/[.!?,;:'"()[\]{}]/g) || [];
  punctuation.forEach(p => {
    punctuationDistribution[p] = (punctuationDistribution[p] || 0) + 1;
  });
  
  // Calculate readability score (Flesch-Kincaid)
  const readabilityScore = calculateReadabilityScore(text);
  
  // Calculate lexical density
  const lexicalWords = words.filter(w => !isStopWord(w));
  const lexicalDensity = lexicalWords.length / words.length;
  
  return {
    averageSentenceLength,
    sentenceLengthVariance,
    wordFrequencies,
    uniqueWordsRatio,
    punctuationDistribution,
    paragraphLengths: paragraphs.map(p => p.length),
    readabilityScore,
    lexicalDensity
  };
}

async function calculateStyleMetrics(text: string): Promise<StyleMetrics> {
  const sentences = text.split(/[.!?]+/);
  const words = text.split(/\s+/);
  
  // Calculate passive voice ratio
  const passiveVoiceMatches = text.match(AI_PATTERNS.passive_voice) || [];
  const passiveVoiceRatio = passiveVoiceMatches.length / sentences.length;
  
  // Calculate transition density
  const transitionMatches = text.match(AI_PATTERNS.mechanical_transitions) || [];
  const transitionDensity = transitionMatches.length / sentences.length;
  
  // Calculate formality score
  const formalityScore = calculateFormalityScore(text);
  
  // Calculate sentence variety
  const sentenceVariety = calculateSentenceVariety(sentences);
  
  // Calculate vocabulary complexity
  const vocabularyComplexity = calculateVocabularyComplexity(words);
  
  return {
    passiveVoiceRatio,
    transitionDensity,
    formalityScore,
    sentenceVariety,
    vocabularyComplexity
  };
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/);
  const syllables = countSyllables(text);
  
  // Flesch-Kincaid Grade Level
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.reduce((count, word) => {
    return count + word.match(/[aeiouy]+/g)?.length || 1;
  }, 0);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'
  ]);
  return stopWords.has(word.toLowerCase());
}

function calculateFormalityScore(text: string): number {
  const formalIndicators = text.match(/\b(therefore|hence|thus|accordingly|consequently)\b/gi) || [];
  const informalIndicators = text.match(/\b(like|you know|kind of|sort of|basically)\b/gi) || [];
  
  return (formalIndicators.length - informalIndicators.length + 5) / 10;
}

function calculateSentenceVariety(sentences: string[]): number {
  const types = sentences.map(s => {
    if (s.match(/^(Who|What|When|Where|Why|How)\b/i)) return 'question';
    if (s.match(/^[A-Z][^.!?]+[!]/)) return 'exclamation';
    if (s.match(/^[A-Z][^.!?]+[?]/)) return 'question';
    return 'statement';
  });
  
  const uniqueTypes = new Set(types).size;
  return uniqueTypes / 4; // Normalized to 0-1
}

function calculateVocabularyComplexity(words: string[]): number {
  const complexWords = words.filter(w => w.length > 6).length;
  return complexWords / words.length;
}

async function performSemanticAnalysis(text: string): Promise<number> {
  // Analyze semantic coherence
  const coherenceScore = analyzeSemanticCoherence(text);
  
  // Analyze topic consistency
  const topicScore = analyzeTopicConsistency(text);
  
  // Analyze contextual relevance
  const contextScore = analyzeContextualRelevance(text);
  
  return (coherenceScore + topicScore + contextScore) / 3;
}

function analyzeSemanticCoherence(text: string): number {
  const sentences = text.split(/[.!?]+/);
  let coherenceScore = 0;
  
  // Check for logical flow between sentences
  for (let i = 1; i < sentences.length; i++) {
    const prevSentence = sentences[i - 1];
    const currentSentence = sentences[i];
    
    // Check for shared terms
    const sharedTerms = findSharedTerms(prevSentence, currentSentence);
    coherenceScore += sharedTerms.length * 0.1;
    
    // Check for semantic transitions
    if (hasSemanticTransition(prevSentence, currentSentence)) {
      coherenceScore += 0.2;
    }
  }
  
  return Math.min(1, coherenceScore / sentences.length);
}

function findSharedTerms(text1: string, text2: string): string[] {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  return Array.from(words1).filter(word => words2.has(word));
}

function hasSemanticTransition(text1: string, text2: string): boolean {
  const transitions = [
    /\b(this|that|these|those|such|the same)\b/i,
    /\b(therefore|thus|hence|consequently)\b/i,
    /\b(however|nevertheless|although)\b/i,
    /\b(similarly|likewise|in the same way)\b/i
  ];
  
  return transitions.some(pattern => text2.match(pattern));
}

function analyzeTopicConsistency(text: string): number {
  const paragraphs = text.split(/\n\s*\n/);
  const keyTerms = extractKeyTerms(text);
  
  let consistencyScore = 0;
  
  // Check each paragraph for key terms
  paragraphs.forEach(paragraph => {
    const paragraphTerms = extractKeyTerms(paragraph);
    const commonTerms = keyTerms.filter(term => paragraphTerms.includes(term));
    consistencyScore += commonTerms.length / keyTerms.length;
  });
  
  return consistencyScore / paragraphs.length;
}

function extractKeyTerms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const frequencies: { [key: string]: number } = {};
  
  // Count word frequencies
  words.forEach(word => {
    if (!isStopWord(word) && word.length > 3) {
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
  });
  
  // Get top frequent terms
  return Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeContextualRelevance(text: string): number {
  const sentences = text.split(/[.!?]+/);
  let relevanceScore = 0;
  
  sentences.forEach((sentence, index) => {
    // Check for context-maintaining elements
    if (index > 0) {
      if (hasContextualReference(sentence)) relevanceScore += 0.2;
      if (maintainsTheme(sentences[index - 1], sentence)) relevanceScore += 0.3;
      if (hasLogicalProgression(sentences[index - 1], sentence)) relevanceScore += 0.5;
    }
  });
  
  return Math.min(1, relevanceScore / sentences.length);
}

function hasContextualReference(text: string): boolean {
  const referencePatterns = [
    /\b(this|that|these|those)\b/i,
    /\b(the aforementioned|the above|the previous)\b/i,
    /\b(such|similar|related)\b/i
  ];
  
  return referencePatterns.some(pattern => text.match(pattern));
}

function maintainsTheme(prevText: string, currentText: string): boolean {
  const prevTerms = extractKeyTerms(prevText);
  const currentTerms = extractKeyTerms(currentText);
  const commonTerms = prevTerms.filter(term => currentTerms.includes(term));
  
  return commonTerms.length >= 1;
}

function hasLogicalProgression(prevText: string, currentText: string): boolean {
  const logicalPatterns = [
    /\b(therefore|thus|consequently|as a result|hence)\b/i,
    /\b(furthermore|moreover|additionally|in addition)\b/i,
    /\b(however|nevertheless|conversely|on the other hand)\b/i,
    /\b(for example|for instance|specifically)\b/i,
    /\b(in conclusion|finally|lastly|to summarize)\b/i
  ];
  
  return logicalPatterns.some(pattern => currentText.match(pattern));
}

function calculateNaturalLanguageScore(
  text: string,
  textMetrics: TextMetrics,
  styleMetrics: StyleMetrics
): number {
  // Combine various metrics into a natural language score
  const metrics = [
    // Variance in sentence length (higher is better)
    normalizeScore(textMetrics.sentenceLengthVariance, 0, 50),
    
    // Unique words ratio (higher is better)
    textMetrics.uniqueWordsRatio,
    
    // Lexical density (should be moderate)
    normalizeScore(Math.abs(0.5 - textMetrics.lexicalDensity), 0, 0.5),
    
    // Sentence variety (higher is better)
    styleMetrics.sentenceVariety,
    
    // Passive voice ratio (should be low)
    1 - styleMetrics.passiveVoiceRatio,
    
    // Transition density (should be moderate)
    normalizeScore(Math.abs(0.3 - styleMetrics.transitionDensity), 0, 0.3),
    
    // Vocabulary complexity (should be moderate)
    normalizeScore(Math.abs(0.4 - styleMetrics.vocabularyComplexity), 0, 0.4)
  ];
  
  return metrics.reduce((sum, score) => sum + score, 0) / metrics.length;
}

function normalizeScore(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function getDetectionLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

// Add new helper functions
function calculateMetricsScore(metrics: TextMetrics): number {
  // Calculate a score based on text metrics
  const scores = [
    normalizeScore(metrics.sentenceLengthVariance, 0, 50),
    metrics.uniqueWordsRatio,
    normalizeScore(metrics.lexicalDensity, 0.4, 0.6),
    normalizeScore(metrics.readabilityScore, 8, 12)
  ];
  
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateStyleScore(metrics: StyleMetrics): number {
  // Calculate a score based on style metrics
  const scores = [
    1 - metrics.passiveVoiceRatio,
    normalizeScore(metrics.transitionDensity, 0.1, 0.3),
    normalizeScore(metrics.formalityScore, 0.3, 0.7),
    metrics.sentenceVariety,
    normalizeScore(metrics.vocabularyComplexity, 0.2, 0.5)
  ];
  
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}