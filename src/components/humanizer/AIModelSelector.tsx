import React from 'react';
import { ModelType } from '../../types';
import { useHumanizeStore } from '../../store/humanizeStore';
import { Ghost, Zap, Cpu, Lock, Crown } from 'lucide-react';
import { useUserPlanStore } from '../../store/userPlanStore';

interface ModelOption {
  type: ModelType;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  requiresPro?: boolean;
}

export const AIModelSelector: React.FC = () => {
  const { model, setModel } = useHumanizeStore();
  const { plan, isLoading } = useUserPlanStore();
  const isPro = plan === 'pro';

  const modelOptions: ModelOption[] = [
    {
      type: 'ninja',
      name: 'Ninja',
      description: 'Quick rewriting with natural phrasing',
      icon: Zap,
      requiresPro: false
    },
    {
      type: 'ghost',
      name: 'Ghost',
      description: 'Deep rewriting for maximum undetectability',
      icon: Ghost,
      requiresPro: true
    },
    {
      type: 'generator',
      name: 'Generator',
      description: 'Create new content variations',
      icon: Cpu,
      requiresPro: true
    },
  ];

  const isModelAvailable = (option: ModelOption) => {
    return !option.requiresPro || isPro;
  };

  const handleModelSelect = (option: ModelOption) => {
    if (!isModelAvailable(option)) {
      // You could add a modal here to show upgrade options
      window.open('/pricing', '_blank');
      return;
    }
    setModel(option.type);
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {modelOptions.map((option) => {
        const isAvailable = isModelAvailable(option);
        const isSelected = model === option.type;
        
        return (
          <button
            key={option.type}
            className={`
              relative flex items-center p-3 rounded-lg border transition-all
              ${isSelected 
                ? 'border-primary-500 bg-primary-50 text-primary-900' 
                : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
              }
              ${!isAvailable ? 'opacity-60 cursor-pointer' : 'cursor-pointer'}
            `}
            onClick={() => handleModelSelect(option)}
          >
            {/* Icon */}
            <div className={`
              p-2 rounded-md mr-3 shrink-0
              ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
            `}>
              <option.icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-grow text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.name}</span>
                  {option.requiresPro && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      PRO
                    </span>
                  )}
                </div>
                {!isAvailable && (
                  <Lock className="h-3 w-3 text-gray-400 ml-2" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white" />
            )}

            {/* Upgrade Overlay for Pro Features */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 rounded-lg flex items-end justify-center p-2">
                <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-full border border-primary-100">
                  Upgrade to Pro
                </span>
              </div>
            )}
          </button>
        );
      })}

      {/* Plan Status */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-600">Current Plan:</span>
        {isLoading ? (
          <span className="text-gray-400">Loading...</span>
        ) : (
          <span className={`font-medium ${isPro ? 'text-amber-600' : 'text-gray-900'}`}>
            {plan.toUpperCase()}
            {isPro && <Crown className="w-4 h-4 ml-1 inline-block text-amber-500" />}
          </span>
        )}
      </div>
    </div>
  );
};