import { loadStripe } from '@stripe/stripe-js';
import { PlanType } from '../types';
import { pricingPlans } from '../data/pricing';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const createCheckoutSession = async (planType: PlanType, billingPeriod: 'monthly' | 'annually') => {
  try {
    const plan = pricingPlans.find(p => p.type === planType);
    if (!plan) throw new Error('Invalid plan type');

    const priceId = billingPeriod === 'monthly' ? plan.stripePriceId.monthly : plan.stripePriceId.annually;
    if (!priceId) throw new Error('Price ID not found');

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        planType,
        billingPeriod,
      }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    
    if (!stripe) throw new Error('Stripe not initialized');
    
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const cancelSubscription = async () => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}; 