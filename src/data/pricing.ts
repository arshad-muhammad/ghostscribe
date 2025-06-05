import { PlanType } from '../types';

export interface PricingPlan {
  type: PlanType;
  name: string;
  description: string;
  price: number;
  features: string[];
  models: string[];
  recommended?: boolean;
  limits: {
    wordsPerDay: number;
    wordsPerRequest: number;
  };
  stripePriceId: {
    monthly: string;
    annually: string;
  };
}

export const pricingPlans: PricingPlan[] = [
  {
    type: 'free',
    name: 'Free',
    description: 'Basic content humanization',
    price: 0,
    features: [
      'Basic content humanization',
      'Limited to 1,000 words/day',
      'Max 500 words per request',
      'Standard support'
    ],
    models: ['ninja'],
    limits: {
      wordsPerDay: 1000,
      wordsPerRequest: 500
    },
    stripePriceId: {
      monthly: '',
      annually: ''
    }
  },
  {
    type: 'pro',
    name: 'Pro',
    description: 'Enterprise-grade humanization',
    price: 9.99,
    features: [
      'Enterprise-grade humanization',
      '250,000 words/day',
      'Max 10,000 words per request',
      'Premium AI detection suite',
      'Advanced multi-language support',
      'API access',
      'Dedicated account manager'
    ],
    models: ['ninja', 'ghost', 'generator'],
    recommended: true,
    limits: {
      wordsPerDay: 250000,
      wordsPerRequest: 10000
    },
    stripePriceId: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || '',
      annually: import.meta.env.VITE_STRIPE_PRICE_ID_PRO_YEARLY || ''
    }
  }
];