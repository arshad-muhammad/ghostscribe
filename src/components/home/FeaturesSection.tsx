import React from 'react';
import { features } from '../../data/features';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Everything you need to transform AI content into authentic human writing.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="relative bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="absolute -top-3 -left-3 flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="ml-6 mt-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};