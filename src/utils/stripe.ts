import { PlanType } from '../types';
import { pricingPlans } from '../data/pricing';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Validate price ID format
const validatePriceId = (priceId: string) => {
  if (!priceId.startsWith('price_')) {
    throw new Error(`Invalid price ID format: ${priceId}. Must start with "price_"`);
  }
  return priceId;
};

export const createCheckoutSession = async (planType: PlanType, billingPeriod: 'monthly' | 'annually', userId: string) => {
  try {
    // First verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session?.access_token) {
      console.error('No session or access token found');
      throw new Error('No active session found. Please log in again.');
    }

    // Then get the plan and price ID
    const plan = pricingPlans.find(p => p.type === planType);
    if (!plan) throw new Error('Invalid plan type');

    const priceId = billingPeriod === 'monthly' ? plan.stripePriceId.monthly : plan.stripePriceId.annually;
    
    // Validate price ID
    try {
      validatePriceId(priceId);
    } catch (error) {
      console.error('Price ID validation failed:', error);
      throw new Error(`Invalid price ID for ${planType} plan (${billingPeriod}). Please check your environment variables.`);
    }

    console.log('Creating checkout session with:', {
      planType,
      billingPeriod,
      priceId,
      userId,
      hasToken: true,
      tokenPreview: session.access_token.substring(0, 20) + '...'
    });

    // Make the API request
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
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
      console.error('Checkout session error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestDetails: {
          url: `${API_URL}/api/create-checkout-session`,
          hasToken: !!session.access_token,
          userId,
          priceId
        }
      });
      
      if (response.status === 401) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Session expired. Please log in again.');
        }
        
        // Retry with new token
        const retryResponse = await fetch(`${API_URL}/api/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshData.session.access_token}`
          },
          body: JSON.stringify({
            priceId,
            planType,
            billingPeriod,
            userId,
          }),
        });

        if (!retryResponse.ok) {
          const retryErrorData = await retryResponse.json().catch(() => null);
          throw new Error(retryErrorData?.error || `Failed to create checkout session: ${retryResponse.status}`);
        }

        const { url } = await retryResponse.json();
        if (!url) throw new Error('No checkout URL returned from server');
        window.location.href = url;
        return;
      }

      throw new Error(errorData?.error || `Failed to create checkout session: ${response.status}`);
    }

    const { url } = await response.json();
    if (!url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const cancelSubscription = async () => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    const response = await fetch(`${API_URL}/api/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cancellation response:', data);
      throw new Error(data.details || data.error || `Failed to cancel subscription: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    throw error;
  }
}; 