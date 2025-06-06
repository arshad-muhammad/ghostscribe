import { loadStripe } from '@stripe/stripe-js';
import { PlanType } from '../types';
import { pricingPlans } from '../data/pricing';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const createCheckoutSession = async (planType: PlanType, billingPeriod: 'monthly' | 'annually', userId: string) => {
  try {
    const plan = pricingPlans.find(p => p.type === planType);
    if (!plan) throw new Error('Invalid plan type');

    const priceId = billingPeriod === 'monthly' ? plan.stripePriceId.monthly : plan.stripePriceId.annually;
    if (!priceId) {
      throw new Error(`Price ID not found for ${planType} plan (${billingPeriod}). Please check your environment variables.`);
    }

    console.log('Creating checkout session with:', {
      planType,
      billingPeriod,
      priceId,
      userId
    });

    const response = await fetch(`/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        planType,
        billingPeriod,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
      const errorDetails = errorData?.details ? `: ${errorData.details}` : '';
      throw new Error(errorMessage + errorDetails);
    }

    const { sessionId } = await response.json();
    if (!sessionId) {
      throw new Error('No session ID returned from server');
    }

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not initialized. Please check your Stripe public key.');
    
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const cancelSubscription = async () => {
  try {
    const response = await fetch(`/api/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Failed to cancel subscription: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}; 