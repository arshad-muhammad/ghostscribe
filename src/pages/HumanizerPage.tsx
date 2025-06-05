import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { TextEditor } from '../components/humanizer/TextEditor';
import { AIModelSelector } from '../components/humanizer/AIModelSelector';
import { HumanizationLevelSlider } from '../components/humanizer/HumanizationLevelSlider';
import { LanguageSelector } from '../components/humanizer/LanguageSelector';
import { AIDetectionChecker } from '../components/humanizer/AIDetectionChecker';
import { Wand2 } from 'lucide-react';

const HumanizerContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-12 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <Wand2 className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
              Content Humanizer
            </h1>
          </div>
          <p className="mt-2 text-lg md:text-xl text-gray-600 max-w-3xl">
            Transform AI-generated content into natural, human-like text that bypasses AI detection
          </p>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Section - Left Side */}
          <div className="lg:max-h-[800px] overflow-auto custom-scrollbar">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Content Editor</h2>
                <p className="text-sm text-gray-600">Enter or paste your content below to begin transformation</p>
              </div>
              <TextEditor />
            </div>
          </div>

          {/* Settings Section - Right Side */}
          <div className="lg:max-h-[800px] overflow-auto custom-scrollbar pr-2">
            <div className="space-y-6">
              {/* Settings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-8">
                  {/* AI Model Selection - Compact */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Model</h2>
                    <AIModelSelector />
                  </div>
                  
                  {/* Humanization Level */}
                  <div className="pt-6 border-t border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Humanization Level</h2>
                    <HumanizationLevelSlider />
                  </div>
                  
                  {/* Language Selection */}
                  <div className="pt-6 border-t border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Language</h2>
                    <LanguageSelector />
                  </div>
                  
                  {/* AI Detection Check */}
                  <div className="pt-6 border-t border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Detection Check</h2>
                    <AIDetectionChecker />
                  </div>
                </div>
              </div>
              
              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl shadow-sm border border-primary-100 p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-3">Quick Tips</h2>
                <ul className="space-y-2 text-primary-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Start with a lower humanization level and adjust as needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Choose the model based on your content type and goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500">•</span>
                    <span>Use AI detection check to verify the final output</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HumanizerPage: React.FC = () => {
  return (
    <>
      <SignedIn>
        <HumanizerContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

export default HumanizerPage;