import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { TextEditor } from '../components/humanizer/TextEditor';
import { AIModelSelector } from '../components/humanizer/AIModelSelector';
import { HumanizationLevelSlider } from '../components/humanizer/HumanizationLevelSlider';
import { LanguageSelector } from '../components/humanizer/LanguageSelector';
import { AIDetectionChecker } from '../components/humanizer/AIDetectionChecker';

const HumanizerPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Content Humanizer</h1>
        <p className="mt-2 text-lg text-gray-600">
          Transform AI-generated content into natural, human-like text that bypasses AI detection
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TextEditor />
        </div>
        
        <div className="space-y-6">
          <AIModelSelector />
          <HumanizationLevelSlider />
          <LanguageSelector />
          <AIDetectionChecker />
        </div>
      </div>
    </div>
  );
};

export default HumanizerPage;