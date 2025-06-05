import React from 'react';
import { ModelType } from '../../types';
import { useHumanizeStore } from '../../store/humanizeStore';
import { useUserPlanStore } from '../../store/userPlanStore';
import { Ghost, Zap, Cpu } from 'lucide-react';

interface ModelOption {
  type: ModelType;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

export const AIModelSelector: React.FC = () => {
  const { model, setModel } = useHumanizeStore();
  const { userPlan } = useUserPlanStore();

  const modelOptions: ModelOption[] = [
    {
      type: 'ninja',
      name: 'Ninja',
      description: 'Standard rewriting with natural phrasing',
      icon: Zap
    },
    {
      type: 'ghost',
      name: 'Ghost',
      description: 'Deep rewriting to maximize undetectability',
      icon: Ghost
    },
    {
      type: 'generator',
      name: 'Generator',
      description: 'Create new content based on input',
      icon: Cpu
    },
  ];

  const isModelAvailable = (modelType: ModelType) => {
    return userPlan.modelsAvailable.includes(modelType);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelOptions.map((option) => {
          const isAvailable = isModelAvailable(option.type);
          return (
            <div
              key={option.type}
              className={`
                border rounded-lg p-4 transition-all cursor-pointer
                ${model === option.type ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}
                ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-300'}
              `}
              onClick={() => isAvailable && setModel(option.type)}
            >
              <div className="flex items-center">
                <div className={`
                  p-2 rounded-md mr-3
                  ${model === option.type ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}
                `}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{option.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </div>

              {!isAvailable && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-1 rounded text-center">
                  Upgrade plan to unlock
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};