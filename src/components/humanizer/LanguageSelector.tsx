import React from 'react';
import { SupportedLanguage } from '../../types';
import { useHumanizeStore } from '../../store/humanizeStore';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useHumanizeStore();

  const languages: { value: SupportedLanguage; label: string }[] = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'hindi', label: 'Hindi' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Language</h3>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">
        Currently in beta - best results with English
      </p>
    </div>
  );
};