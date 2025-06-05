import React from 'react';
import { FileText, Wand2, Check, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: FileText,
      title: 'Paste Your Text',
      description: "Simply paste your AI-generated content into GhostScribe's editor."
    },
    {
      icon: Wand2,
      title: 'Choose Your Model',
      description: 'Select from Ninja, Ghost, or Generator models and adjust humanization level.'
    },
    {
      icon: Check,
      title: 'Get Human-like Text',
      description: 'Receive your transformed text that passes AI detection tools.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
            How GhostScribe Works
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Transform AI content into human-like text in three simple steps.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative"
              >
                <div className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow z-10">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full transform -translate-y-1/2 -translate-x-1/2 z-0">
                    <ArrowRight className="h-8 w-8 text-primary-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600">
            Our advanced AI models preserve your original meaning while eliminating AI patterns that trigger detection.
          </p>
        </div>
      </div>
    </section>
  );
};