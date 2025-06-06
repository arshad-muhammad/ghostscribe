import React, { useState } from 'react';
import { useHumanizeStore } from '../../store/humanizeStore';
import { Button } from '../ui/Button';
import { Wand2, Copy, RotateCcw, AlertTriangle } from 'lucide-react';
import { useUserPlanStore } from '../../store/userPlanStore';

export const TextEditor: React.FC = () => {
  const { 
    originalText, 
    humanizedText, 
    loading, 
    setOriginalText, 
    humanizeText,
    clearText,
    addToHistory
  } = useHumanizeStore();
  
  const { getFeatures, deductWords } = useUserPlanStore();
  const features = getFeatures();
  
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!originalText.trim()) {
      setError('Please enter some text to humanize');
      return;
    }
    
    const wordCount = originalText.split(/\s+/).filter(Boolean).length;
    
    if (wordCount > features.wordsPerRequest) {
      setError(`Your plan allows a maximum of ${features.wordsPerRequest} words per request`);
      return;
    }
    
    if (wordCount > features.wordsRemaining) {
      setError(`You only have ${features.wordsRemaining} words remaining in your plan`);
      return;
    }
    
    setError(null);
    
    try {
      await humanizeText();
      
      // Deduct words from remaining count
      deductWords(wordCount);
      
      // Add to history
      addToHistory({
        originalText,
        humanizedText,
        model: useHumanizeStore.getState().model,
        level: useHumanizeStore.getState().level,
        wordCount
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(humanizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = originalText.split(/\s+/).filter(Boolean).length;
  const charactersCount = originalText.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original Text */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Original Text</h3>
          <p className="text-sm text-gray-500">Paste your AI-generated content here</p>
        </div>
        <div className="p-4">
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste or type your AI-generated text here..."
            className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Words: {wordCount} | Characters: {charactersCount}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearText}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mb-4 p-3 bg-error-50 border border-error-300 text-error-700 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleHumanize}
            isLoading={loading}
            fullWidth
            leftIcon={<Wand2 className="h-5 w-5" />}
          >
            {loading ? 'Humanizing...' : 'Humanize Text'}
          </Button>
          <div className="mt-2 text-xs text-gray-500 text-center">
            You have {features.wordsRemaining.toLocaleString()} words remaining in your plan
          </div>
        </div>
      </div>
      
      {/* Humanized Text */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Humanized Text</h3>
          <p className="text-sm text-gray-500">Your human-like content will appear here</p>
        </div>
        <div className="p-4">
          <div className={`w-full h-64 p-3 border border-gray-300 rounded-md overflow-auto ${humanizedText ? 'bg-white' : 'bg-gray-50'}`}>
            {humanizedText ? (
              <p className="whitespace-pre-wrap">{humanizedText}</p>
            ) : (
              <p className="text-gray-400 italic">Humanized text will appear here after processing...</p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-end">
            {humanizedText && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4 mr-1" /> {copied ? 'Copied!' : 'Copy Text'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {humanizedText && (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Text successfully humanized</p>
              <p className="text-xs mt-1 text-gray-500">
                Your content has been transformed to appear more human-like while preserving the original meaning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};