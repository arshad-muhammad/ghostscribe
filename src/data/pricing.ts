import { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    type: 'free',
    price: 0,
    billing: 'monthly',
    description: 'For occasional content rewriting needs',
    wordsPerDay: 1000,
    maxWordsPerRequest: 500,
    features: [
      'Basic content humanization',
      'Ninja model access',
      'Limited to 1,000 words/day',
      'Max 500 words per request',
      'Standard support'
    ],
    models: ['ninja'],
    hasAIDetection: false
  },
  {
    name: 'Basic',
    type: 'basic',
    price: 9.99,
    billing: 'monthly',
    description: 'For regular content creators',
    wordsPerDay: 10000,
    maxWordsPerRequest: 2000,
    features: [
      'Advanced content humanization',
      'Ninja & Ghost models',
      '10,000 words/day',
      'Max 2,000 words per request',
      'AI detection checker',
      'Email support'
    ],
    models: ['ninja', 'ghost'],
    hasAIDetection: true
  },
  {
    name: 'Pro',
    type: 'pro',
    price: 29.99,
    billing: 'monthly',
    description: 'For professional content teams',
    wordsPerDay: 50000,
    maxWordsPerRequest: 5000,
    features: [
      'Premium content humanization',
      'All models (Ninja, Ghost, Generator)',
      '50,000 words/day',
      'Max 5,000 words per request',
      'Advanced AI detection tools',
      'Multi-language support',
      'Priority support'
    ],
    models: ['ninja', 'ghost', 'generator'],
    hasAIDetection: true,
    recommended: true
  },
  {
    name: 'Enterprise',
    type: 'enterprise',
    price: 99.99,
    billing: 'monthly',
    description: 'For agencies and large teams',
    wordsPerDay: 250000,
    maxWordsPerRequest: 10000,
    features: [
      'Enterprise-grade humanization',
      'All models with highest quality',
      '250,000 words/day',
      'Max 10,000 words per request',
      'Premium AI detection suite',
      'Advanced multi-language support',
      'API access',
      'Dedicated account manager'
    ],
    models: ['ninja', 'ghost', 'generator'],
    hasAIDetection: true
  }
];