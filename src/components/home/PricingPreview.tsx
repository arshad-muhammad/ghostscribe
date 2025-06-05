import React from 'react';
import { Link } from 'react-router-dom';
import { pricingPlans } from '../../data/pricing';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';

export const PricingPreview: React.FC = () => {
  // Only show the first three plans in the preview
  const previewPlans = pricingPlans.slice(0, 3);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Choose the plan that's right for you.
          </p>
        </div>

        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {previewPlans.map((plan) => (
            <div 
              key={plan.type}
              className={`relative rounded-lg shadow-sm border divide-y divide-gray-200 flex flex-col ${
                plan.recommended ? 'border-primary-400 lg:scale-105 z-10' : 'border-gray-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold text-primary-800">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-6 bg-white rounded-t-lg">
                <h3 className="text-lg font-display font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </p>
                <div className="mt-6">
                  <Link to="/pricing">
                    <Button
                      variant={plan.recommended ? 'primary' : 'outline'}
                      fullWidth
                    >
                      {plan.type === 'free' ? 'Start Free' : 'Get Started'}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="py-6 px-6 bg-gray-50 rounded-b-lg space-y-4">
                <h4 className="text-sm font-medium text-gray-900">What's included:</h4>
                <ul className="space-y-3">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.features.length > 4 && (
                  <Link to="/pricing" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    See all features
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link to="/pricing">
            <Button variant="link" size="lg">
              View all pricing plans and features
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};