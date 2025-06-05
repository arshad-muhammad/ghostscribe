import React from 'react';
import { HumanizationLevel } from '../../types';
import { useHumanizeStore } from '../../store/humanizeStore';

export const HumanizationLevelSlider: React.FC = () => {
  const { level, setLevel } = useHumanizeStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value) as HumanizationLevel;
    setLevel(newLevel);
  };

  const getLevelDescription = (level: HumanizationLevel): string => {
    if (level <= 3) return 'Light rewording while keeping structure similar';
    if (level <= 6) return 'Moderate restructuring with some variations';
    if (level <= 8) return 'Significant rewriting with natural human patterns';
    return 'Maximum humanization with deep restructuring';
  };

  const getLevelColor = (level: HumanizationLevel): string => {
    if (level <= 3) return 'text-green-500';
    if (level <= 6) return 'text-blue-500';
    if (level <= 8) return 'text-purple-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">Humanization Level</h3>
        <span className={`text-xl font-bold ${getLevelColor(level)}`}>{level}</span>
      </div>
      
      <input
        type="range"
        min="1"
        max="10"
        value={level}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
      />
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Minimal</span>
        <span>Balanced</span>
        <span>Maximum</span>
      </div>
      
      <p className="mt-3 text-sm text-gray-600">
        {getLevelDescription(level)}
      </p>
    </div>
  );
};