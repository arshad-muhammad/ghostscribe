import { PlanType } from '../types';
import { pricingPlans } from '../data/pricing';
import { supabase } from './supabase';
import { API_URL } from './config';

// Get the price ID based on the plan type and billing period
const getPriceId = (planType: PlanType, billingPeriod: 'monthly' | 'annually'): string => {
  const plan = pricingPlans.find(p => p.type === planType);
  if (!plan) throw new Error('Invalid plan type');

  const priceId = billingPeriod === 'monthly' ? plan.stripePriceId.monthly : plan.stripePriceId.annually;
  if (!priceId) throw new Error(`No price ID found for ${planType} plan (${billingPeriod})`);

  return priceId;
};

export const createCheckoutSession = async (planType: PlanType, billingPeriod: 'monthly' | 'annually') => {
  try {
    // First verify we have a valid session and get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session?.access_token) {
      console.error('No session or access token found');
      throw new Error('No active session found. Please log in again.');
    }

    // Get the current user to ensure we have the correct ID
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError || !currentUser) {
      console.error('User error:', userError);
      throw new Error('Could not verify user identity');
    }

    // Get the price ID based on the plan type and billing period
    const priceId = getPriceId(planType, billingPeriod);
    
    console.log('Creating checkout session with:', {
      planType,
      billingPeriod,
      priceId,
      userId: currentUser.id,
      hasToken: !!session.access_token
    });

    // Make the API request with the auth token
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
        userId: currentUser.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Checkout session error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestDetails: {
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    if (!url) throw new Error('No checkout URL returned');

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
      },
      credentials: 'include'
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