import React, { useState } from 'react';
import { useHumanizeStore } from '../../store/humanizeStore';
import { Button } from '../ui/Button';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useUserPlanStore } from '../../store/userPlanStore';

export const AIDetectionChecker: React.FC = () => {
  const { humanizedText, loading, detectionScore, checkDetection } = useHumanizeStore();
  const { getFeatures } = useUserPlanStore();
  const features = getFeatures();
  const [error, setError] = useState<string | null>(null);

  const handleCheckDetection = async () => {
    if (!humanizedText) {
      setError('You need to humanize some text first');
      return;
    }
    
    if (!features.hasAIDetection) {
      setError('AI detection checking is not available on your current plan');
      return;
    }
    
    setError(null);
    
    try {
      await checkDetection();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getScoreColor = () => {
    if (!detectionScore) return 'bg-gray-100';
    
    const { level } = detectionScore;
    if (level === 'low') return 'bg-success-100 text-success-700';
    if (level === 'medium') return 'bg-warning-100 text-warning-700';
    return 'bg-error-100 text-error-700';
  };

  const getScoreIcon = () => {
    if (!detectionScore) return null;
    
    const { level } = detectionScore;
    if (level === 'low') return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    if (level === 'medium') return <AlertTriangle className="h-5 w-5 text-warning-500" />;
    return <XCircle className="h-5 w-5 text-error-500" />;
  };

  const getScoreText = () => {
    if (!detectionScore) return 'No detection check performed';
    
    const { level, score } = detectionScore;
    if (level === 'low') return `Low risk (${score}%) - Likely to pass AI detectors`;
    if (level === 'medium') return `Medium risk (${score}%) - May trigger some AI detectors`;
    return `High risk (${score}%) - Likely to be flagged as AI-generated`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI Detection Check</h3>
          <p className="text-sm text-gray-500">Check if your content will pass AI detection tools</p>
        </div>
        
        <Button
          onClick={handleCheckDetection}
          isLoading={loading}
          disabled={!humanizedText || !features.hasAIDetection}
          leftIcon={<ShieldCheck className="h-5 w-5" />}
          size="sm"
        >
          Check Detection
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-300 text-error-700 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {!features.hasAIDetection && !error && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-md">
          <p className="text-sm">AI detection checking is available on paid plans. <a href="/pricing" className="text-primary-600 hover:text-primary-800">Upgrade your plan</a> to access this feature.</p>
        </div>
      )}
      
      <div className={`p-4 rounded-lg ${getScoreColor()}`}>
        <div className="flex items-center">
          {getScoreIcon()}
          <span className="ml-2 font-medium">{getScoreText()}</span>
        </div>
        
        {detectionScore && (
          <div className="mt-2 text-sm">
            <div className="w-full bg-white rounded-full h-2.5 mb-2">
              <div 
                className={`h-2.5 rounded-full ${
                  detectionScore.level === 'low' ? 'bg-success-500' :
                  detectionScore.level === 'medium' ? 'bg-warning-500' : 'bg-error-500'
                }`}
                style={{ width: `${detectionScore.score}%` }}
              ></div>
            </div>
            <p className={detectionScore.level === 'low' ? 'text-success-700' : detectionScore.level === 'medium' ? 'text-warning-700' : 'text-error-700'}>
              {detectionScore.detector} result: {detectionScore.score}% AI probability
            </p>
          </div>
        )}
      </div>
    </div>
  );
};