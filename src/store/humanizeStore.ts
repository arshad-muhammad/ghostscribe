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
  // Higher temperature for more randomness and creativity
  const baseTemp = 0.85 + (level * 0.015); // Starts higher, increases more gradually
  const randomFactor = Math.random() * 0.1; // Smaller random variation for more consistency
  return Math.min(0.98, baseTemp + randomFactor); // Cap at 0.98 to maintain some coherence
};

// Get top_p value based on humanization level
const getTopPForLevel = (level: HumanizationLevelValue): number => {
  // Higher top_p for more diverse vocabulary choices
  const baseTopP = 0.75 + (level * 0.02); // Starts higher, increases more gradually
  const randomFactor = Math.random() * 0.15; // Moderate random variation
  return Math.min(0.95, baseTopP + randomFactor); // Cap at 0.95 to maintain quality
};

// Get top_k value based on humanization level
const getTopKForLevel = (level: HumanizationLevelValue): number => {
  // Lower top_k for more focused but still diverse vocabulary
  const baseTopK = 20 + (level * 5); // More controlled vocabulary expansion
  const randomFactor = Math.floor(Math.random() * 10); // Smaller random variation
  return Math.min(60, baseTopK + randomFactor); // Cap at 60 for better focus
};

// Enhanced Academic AI Detection Patterns with Human Variance
const AI_PATTERNS = {
  // Core Academic Patterns
  repetitive_phrases: /\b(\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+)\b.*\1/gi, // Expanded to 6-word phrases
  common_ai_phrases: /\b(as an ai language model|i must note that|i am unable to|i do not have personal|it is important to note that|it should be noted that)\b/gi,
  uniform_sentence_length: /^[^.!?]{40,50}[.!?]\s+[^.!?]{40,50}[.!?]\s+[^.!?]{40,50}[.!?]\s+[^.!?]{40,50}[.!?]\s+[^.!?]{40,50}[.!?]/gm, // Detects 5 consecutive similar-length sentences
  
  // Academic Style Patterns
  mechanical_transitions: /\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b.*\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b.*\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b.*\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/gi, // Flags quadruple repetition
  overused_hedging: /\b(might|may|could|possibly|potentially|perhaps|probably)\b.*\b(might|may|could|possibly|potentially|perhaps|probably)\b.*\b(might|may|could|possibly|potentially|perhaps|probably)\b.*\b(might|may|could|possibly|potentially|perhaps|probably)\b/gi, // Flags quadruple repetition
  
  // Structure Patterns
  formal_stiffness: /\b(it is|there are|this suggests|this indicates|this demonstrates)\b.*\b(it is|there are|this suggests|this indicates|this demonstrates)\b.*\b(it is|there are|this suggests|this indicates|this demonstrates)\b.*\b(it is|there are|this suggests|this indicates|this demonstrates)\b/gi,
  passive_voice: /\b(is|are|was|were)\s+\w+ed\b.*\b(is|are|was|were)\s+\w+ed\b.*\b(is|are|was|were)\s+\w+ed\b.*\b(is|are|was|were)\s+\w+ed\b/gi,
  list_patterns: /(?:(?:\d+\.|[-•])\s+.*\n){8,}/g, // Increased threshold to 8
  
  // Academic Phrases
  academic_phrases: /\b(in the context of|with respect to|in terms of|with regard to|concerning the matter of)\b.*\b(in the context of|with respect to|in terms of|with regard to|concerning the matter of)\b.*\b(in the context of|with respect to|in terms of|with regard to|concerning the matter of)\b/gi,
  
  // Natural Variation
  sentence_starts: /(?:^|\n)(?:The|This|These|Those|Such)\b.*?[.!?]\s+(?:The|This|These|Those|Such)\b.*?[.!?]\s+(?:The|This|These|Those|Such)\b.*?[.!?]\s+(?:The|This|These|Those|Such)\b/gm,
  punctuation_variety: /(?:[^.!?]+[.]\s+){10,}/g, // Increased threshold to 10
  
  // Flow Patterns
  conclusion_markers: /\b(in conclusion|to conclude|finally|lastly|to summarize|in summary|to sum up)\b.*\b(in conclusion|to conclude|finally|lastly|to summarize|in summary|to sum up)\b.*\b(in conclusion|to conclude|finally|lastly|to summarize|in summary|to sum up)\b/gmi,
  transition_variety: /\b(however|nevertheless|nonetheless|conversely|similarly|in contrast|alternatively)\b.*\b(however|nevertheless|nonetheless|conversely|similarly|in contrast|alternatively)\b.*\b(however|nevertheless|nonetheless|conversely|similarly|in contrast|alternatively)\b/gi,
  
  // Natural Academic Language
  formulaic_phrases: /\b(it goes without saying|needless to say|it should be noted|it is crucial to|it is essential to|it is worth noting|it is important to consider)\b.*\b(it goes without saying|needless to say|it should be noted|it is crucial to|it is essential to|it is worth noting|it is important to consider)\b.*\b(it goes without saying|needless to say|it should be noted|it is crucial to|it is essential to|it is worth noting|it is important to consider)\b/gi
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
        const fullPrompt = `${prompt}\n\nRewrite this as a human academic writing under pressure, maintaining scholarly authority while ensuring complete undetectability:\n${originalText}\n\nYour version (write with natural academic imperfection):\n\nNOTE: 
- Vary sentence length (15-45 words) and complexity
- Mix passive/active voice naturally
- Use hedging language ("may suggest," "potentially indicates")
- Add parenthetical thoughts and em-dashes
- Include plausible citations (e.g., "As noted by Chen et al. (2023)")
- Express measured uncertainty and question assumptions
- Break perfect patterns while maintaining expertise
- Add controlled imperfections in flow and structure

Write like a real academic: formal but human, precise but not perfect.`;

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
          language,
          wordCount: originalText.split(/\s+/).length
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
  const basePrompt = `You're a human writer with your own quirky style. Write this in a way that's completely undetectable but still flows naturally.

WRITING STYLE:

1. Sentence Mixing:
   - Use super short fragments. Like this
   - Then follow with longer, more complex thoughts that wind their way through multiple ideas—sometimes breaking unexpectedly
   - Start with conjunctions. But make it natural
   - Add sudden breaks... then continue
   - Mix up your rhythm (keep it random)

2. Personal Touches:
   - Drop in random thoughts [hmm...]
   - Question yourself mid-sentence
   - Share quick reactions
   - Add *emphasis* marks
   - Use ~style effects~ sometimes

3. Pattern Breaking:
   - Space out words  randomly
   - Use weird punctuation?!...
   - CAPITALIZE for emphasis
   - Switch tenses unexpectedly
   - Break grammar rules (when it feels right)

4. Flow Control:
   - Jump between ideas naturally
   - Circle back to earlier points
   - Leave thoughts unfinished...
   - Connect concepts unexpectedly
   - Mix formal/casual language

5. Unique Elements:
   - Add personal asides (like this)
   - Use regional expressions
   - Create compound-words
   - Reference random things
   - End with prepositions at

CORE RULES:
1. Stay unpredictable
2. Keep it flowing
3. Break patterns
4. Add personality
5. Be unique

Write directly - no explanations.`;

  const modelSpecific = {
    ninja: `You're a seasoned academic writing under pressure, balancing scholarly rigor with human nuance. Create undetectable yet authoritative content.

ACADEMIC AUTHENTICITY:

1. Sentence Dynamics:
   - Mix short and complex structures
   - Vary between 15-45 words
   - Use em-dashes for asides—like this
   - Add parenthetical thoughts (often from experience)
   - Break rhythm intentionally

2. Scholarly Voice:
   - "While one might assume..."
   - "It appears that..."
   - "A potential explanation may lie in..."
   - "Though not widely emphasized..."
   - "From a [field] perspective..."

3. Human Uncertainty:
   - Express measured doubt
   - Use "may suggest" naturally
   - Add "potentially indicates"
   - Include "not entirely clear"
   - Question assumptions

4. Citation Style:
   - Reference plausible studies
   - "As Chen et al. (2023) noted..."
   - Mention ongoing debates
   - Add field-specific context
   - Question existing literature

5. Technical Authenticity:
   - Mix passive/active voice
   - Add controlled imperfections
   - Use domain terminology naturally
   - Include subtle hedging
   - Break perfect patterns

WRITING APPROACH:
1. Stay scholarly but imperfect
2. Vary sentence complexity
3. Add human uncertainty
4. Include realistic references
5. Break AI patterns subtly

Remember: Write like a human academic under pressure - maintain expertise while showing natural variation.

✅ High perplexity + burstiness
🚫 NO AI detection patterns`,

    ghost: `You're a seasoned academic writing under pressure, balancing scholarly rigor with human nuance. Create undetectable yet authoritative content.

ACADEMIC AUTHENTICITY:

1. Sentence Dynamics:
   - Mix short and complex structures
   - Vary between 15-45 words
   - Use em-dashes for asides—like this
   - Add parenthetical thoughts (often from experience)
   - Break rhythm intentionally

2. Scholarly Voice:
   - "While one might assume..."
   - "It appears that..."
   - "A potential explanation may lie in..."
   - "Though not widely emphasized..."
   - "From a [field] perspective..."

3. Human Uncertainty:
   - Express measured doubt
   - Use "may suggest" naturally
   - Add "potentially indicates"
   - Include "not entirely clear"
   - Question assumptions

4. Citation Style:
   - Reference plausible studies
   - "As Chen et al. (2023) noted..."
   - Mention ongoing debates
   - Add field-specific context
   - Question existing literature

5. Technical Authenticity:
   - Mix passive/active voice
   - Add controlled imperfections
   - Use domain terminology naturally
   - Include subtle hedging
   - Break perfect patterns

WRITING APPROACH:
1. Stay scholarly but imperfect
2. Vary sentence complexity
3. Add human uncertainty
4. Include realistic references
5. Break AI patterns subtly

Remember: Write like a human academic under pressure - maintain expertise while showing natural variation.

✅ High perplexity + burstiness
🚫 NO AI detection patterns`,

    generator: `You're a seasoned academic writing under pressure, balancing scholarly rigor with human nuance. Create undetectable yet authoritative content.

ACADEMIC AUTHENTICITY:

1. Sentence Dynamics:
   - Mix short and complex structures
   - Vary between 15-45 words
   - Use em-dashes for asides—like this
   - Add parenthetical thoughts (often from experience)
   - Break rhythm intentionally

2. Scholarly Voice:
   - "While one might assume..."
   - "It appears that..."
   - "A potential explanation may lie in..."
   - "Though not widely emphasized..."
   - "From a [field] perspective..."

3. Human Uncertainty:
   - Express measured doubt
   - Use "may suggest" naturally
   - Add "potentially indicates"
   - Include "not entirely clear"
   - Question assumptions

4. Citation Style:
   - Reference plausible studies
   - "As Chen et al. (2023) noted..."
   - Mention ongoing debates
   - Add field-specific context
   - Question existing literature

5. Technical Authenticity:
   - Mix passive/active voice
   - Add controlled imperfections
   - Use domain terminology naturally
   - Include subtle hedging
   - Break perfect patterns

WRITING APPROACH:
1. Stay scholarly but imperfect
2. Vary sentence complexity
3. Add human uncertainty
4. Include realistic references
5. Break AI patterns subtly

Remember: Write like a human academic under pressure - maintain expertise while showing natural variation.

✅ High perplexity + burstiness
🚫 NO AI detection patterns`
  }[model];

  const levelAdjustments = {
    1: "Combine scholarly rigor with engaging style",
    2: "Combine scholarly rigor with engaging style",
    3: "Combine scholarly rigor with engaging style",
    4: "Combine scholarly rigor with engaging style",
    5: "Combine scholarly rigor with engaging style",
    6: "Combine scholarly rigor with engaging style",
    7: "Use academic language with natural flair",
    8: "Combine scholarly rigor with engaging style",
    9: "Combine scholarly rigor with engaging style",
    10: "Combine scholarly rigor with engaging style"
  }[level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10] || "Write with natural academic authenticity";

  const languageGuidelines = getLanguageGuidelines(language);

  return `${basePrompt}\n\n${modelSpecific}\n\n${levelAdjustments}\n\n${languageGuidelines}`;
};

async function performLocalAIDetection(text: string): Promise<number> {
  // Initialize score components
  let totalScore = 0;
  const weights = {
    // Core detection (15% total)
    repetitivePhrasesWeight: 6,
    commonAiPhrasesWeight: 4,
    uniformSentenceLengthWeight: 5,
    
    // Academic style (25% total)
    mechanicalTransitionsWeight: 5,
    overusedHedgingWeight: 7,
    formalStiffnessWeight: 6,
    passiveVoiceWeight: 4,
    listPatternsWeight: 3,
    
    // Natural language (35% total)
    textMetricsWeight: 12,
    styleMetricsWeight: 13,
    naturalLanguageWeight: 10,
    
    // Semantic coherence (25% total)
    semanticCoherenceWeight: 13,
    sentenceVarietyWeight: 12
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
    const matches = word.match(/[aeiouy]+/g);
    return count + (matches ? matches.length : 1);
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