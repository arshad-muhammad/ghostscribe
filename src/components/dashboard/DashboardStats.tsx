import React from 'react';
import { useUserPlanStore } from '../../store/userPlanStore';
import { useHumanizeStore } from '../../store/humanizeStore';
import { FileText, BarChart3, RefreshCw } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { userPlan } = useUserPlanStore();
  const { history } = useHumanizeStore();
  
  // Calculate usage stats
  const wordsUsed = userPlan.plan === 'free' ? 1000 - userPlan.wordsRemaining : 
                    userPlan.plan === 'basic' ? 10000 - userPlan.wordsRemaining :
                    userPlan.plan === 'pro' ? 50000 - userPlan.wordsRemaining :
                    250000 - userPlan.wordsRemaining;
  
  const usagePercentage = userPlan.plan === 'free' ? Math.round((wordsUsed / 1000) * 100) : 
                          userPlan.plan === 'basic' ? Math.round((wordsUsed / 10000) * 100) :
                          userPlan.plan === 'pro' ? Math.round((wordsUsed / 50000) * 100) :
                          Math.round((wordsUsed / 250000) * 100);
  
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
                <p className="text-xl font-bold">{userPlan.wordsRemaining.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usagePercentage}% used ({wordsUsed.toLocaleString()} / {
                  userPlan.plan === 'free' ? '1,000' :
                  userPlan.plan === 'basic' ? '10,000' :
                  userPlan.plan === 'pro' ? '50,000' : '250,000'
                })
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
                Total words processed: {history.reduce((total, item) => total + item.wordCount, 0).toLocaleString()}
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
                <p className="text-xl font-bold capitalize">{userPlan.plan}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Max words per request: {userPlan.maxWordsPerRequest.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};