import React, { useEffect } from 'react';
import { useUserPlanStore } from '../../store/userPlanStore';
import { useHumanizeStore } from '../../store/humanizeStore';
import { FileText, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { plan, wordsRemaining, isLoading, error, checkPlanStatus } = useUserPlanStore();
  const { history } = useHumanizeStore();

  useEffect(() => {
    checkPlanStatus();
  }, [checkPlanStatus]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="h-16 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-error-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center text-error-600 mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Error Loading Stats</h3>
          </div>
          <p className="text-error-600">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate usage stats
  const totalWords = plan === 'free' ? 2000 : 500000;
  const wordsUsed = totalWords - wordsRemaining;
  const usagePercentage = Math.min(100, Math.max(0, Math.round((wordsUsed / totalWords) * 100)));
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Words Remaining */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-primary-100 text-primary-700 mr-4">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Words Remaining</p>
                <p className="text-xl font-bold">{wordsRemaining.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usagePercentage}% used ({wordsUsed.toLocaleString()} / {totalWords.toLocaleString()})
              </p>
            </div>
          </div>
          
          {/* Documents Processed */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-secondary-100 text-secondary-700 mr-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Documents Processed</p>
                <p className="text-xl font-bold">{history.length}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Total words processed: {history.reduce((total, item) => total + (item.wordCount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Current Plan */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-accent-100 text-accent-700 mr-4">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Plan</p>
                <p className="text-xl font-bold capitalize">{plan}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Daily limit: {plan === 'free' ? '2,000' : '5,000'} words
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max per request: {plan === 'free' ? '500' : '10,000'} words
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};