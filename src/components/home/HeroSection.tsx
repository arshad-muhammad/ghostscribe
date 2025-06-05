import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import ReactTypingEffect from 'react-typing-effect';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-display font-bold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Transform AI content into</span>{' '}
                <span className="block text-primary-600 mt-1">
                  <ReactTypingEffect
                    text={['undetectable text.', 'human-like writing.', 'authentic content.']}
                    speed={100}
                    eraseSpeed={100}
                    typingDelay={200}
                    eraseDelay={2000}
                    className="inline-block"
                  />
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                GhostScribe uses advanced AI to transform AI-generated content into human-like text that bypasses detection tools while preserving your original meaning.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link to="/humanizer">
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="ml-2 -mr-1 w-5 h-5" />}
                      className="w-full"
                    >
                      Try GhostScribe Free
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link to="/pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full bg-gradient-to-tr from-secondary-200 via-primary-100 to-accent-100 opacity-90 rounded-bl-3xl"></div>
        <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-filter backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-lg p-8 bg-white rounded-lg shadow-xl transform -rotate-2 animate-pulse-slow">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-primary-100 rounded w-2/3"></div>
            </div>
          </div>
          <div className="max-w-lg p-8 bg-white rounded-lg shadow-xl transform rotate-3 ml-4 animate-pulse-slow animation-delay-1000">
            <div className="space-y-4">
              <div className="h-4 bg-primary-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};