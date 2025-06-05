import React, { useState } from 'react';
import { useHumanizeStore } from '../../store/humanizeStore';
import { formatDistanceToNow } from '../../utils/date';
import { Button } from '../ui/Button';
import { Copy, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const RecentHistory: React.FC = () => {
  const { history } = useHumanizeStore();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreIcon = (score?: number) => {
    if (!score) return null;
    
    if (score < 30) return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    if (score < 70) return <AlertTriangle className="h-5 w-5 text-warning-500" />;
    return <XCircle className="h-5 w-5 text-error-500" />;
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    
    if (score < 30) return 'text-success-600';
    if (score < 70) return 'text-warning-600';
    return 'text-error-600';
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No activity yet. Start humanizing content to see your history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-4">
          {history.slice(0, 5).map((item) => (
            <div 
              key={item.id}
              className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors flex justify-between items-center"
                onClick={() => toggleItem(item.id)}
              >
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">
                      {item.wordCount} words
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(item.date)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-sm">
                    <span className="capitalize text-primary-600 font-medium">{item.model}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-500">Level {item.level}</span>
                    
                    {item.detectionScore && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <div className="flex items-center">
                          {getScoreIcon(item.detectionScore.score)}
                          <span className={`ml-1 ${getScoreColor(item.detectionScore.score)}`}>
                            {item.detectionScore.score}% AI
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-400">
                  {expandedItemId === item.id ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
              
              {expandedItemId === item.id && (
                <div className="p-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text:</h4>
                      <div className="bg-white p-3 rounded border border-gray-200 text-sm max-h-48 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{item.originalText}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Humanized Text:</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(item.humanizedText, item.id)}
                          leftIcon={<Copy className="h-4 w-4" />}
                        >
                          {copiedId === item.id ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 text-sm max-h-48 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{item.humanizedText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {history.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="link"
              size="sm"
            >
              View All History
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};