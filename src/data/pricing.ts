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

// Make sure these match your Stripe product price IDs
const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID;

if (!MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
  console.error('Missing Stripe price IDs in environment variables');
}

export const pricingPlans: PricingPlan[] = [
  {
    type: 'free',
    name: 'Free',
    description: 'Basic content humanization',
    price: 0,
    features: [
      'Basic content humanization',
      'Limited to 2,000 words/day',
      'Max 500 words per request',
      'Standard support'
    ],
    models: ['ninja'],
    limits: {
      wordsPerDay: 2000,
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
      '500,000 total words',
      '5,000 words per day',
      'Max 10,000 words per request',
      'Premium AI detection suite',
      'Advanced multi-language support',
      'API access',
      'Dedicated account manager'
    ],
    models: ['ninja', 'ghost', 'generator'],
    recommended: true,
    limits: {
      wordsPerDay: 5000,
      wordsPerRequest: 10000
    },
    stripePriceId: {
      monthly: MONTHLY_PRICE_ID || '',
      annually: YEARLY_PRICE_ID || ''
    }
  }
];