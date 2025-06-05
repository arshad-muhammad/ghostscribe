import React, { useState } from 'react';
import { pricingPlans } from '../data/pricing';
import { Button } from '../components/ui/Button';
import { Check, X, Crown } from 'lucide-react';
import { useAuth, SignUpButton } from '@clerk/clerk-react';
import { useUserPlanStore } from '../store/userPlanStore';
import { PlanType } from '../types';
import { createCheckoutSession, cancelSubscription } from '../utils/stripe';
import { toast } from 'sonner';

const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const { isSignedIn, isLoaded } = useAuth();
  const { userPlan, updatePlan } = useUserPlanStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planType: PlanType) => {
    if (!isSignedIn) {
      return;
    }

    setIsLoading(true);
    try {
      if (planType === 'free' && userPlan.plan === 'pro') {
        // Handle downgrade to free
        await cancelSubscription();
        updatePlan('free');
        toast.success('Successfully downgraded to free plan');
      } else if (planType === 'pro') {
        // Handle upgrade to pro
        const result = await createCheckoutSession(planType, billingPeriod);
        if (!result) {
          throw new Error('Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error handling plan selection:', error);
      if (error instanceof Error) {
        toast.error(`Failed to process plan selection: ${error.message}`);
      } else {
        toast.error('Failed to process plan selection');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = (planType: PlanType) => {
    if (!isSignedIn) {
      return planType === 'free' ? 'Start Free' : 'Sign Up';
    }
    
    if (userPlan.plan === planType) {
      return planType === 'pro' ? 'Cancel Subscription' : 'Current Plan';
    }
    
    return planType === 'free' ? 'Downgrade' : 'Upgrade';
  };

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-gray-900">Pricing Plans</h1>
        {userPlan.plan === 'pro' && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full">
            <Crown className="h-5 w-5" />
            <span className="font-medium">Pro User</span>
          </div>
        )}
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the perfect plan for your content humanization needs
        </p>
        
        <div className="mt-6">
          <div className="relative bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingPeriod === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billingPeriod === 'annually' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Annually <span className="text-primary-600 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {pricingPlans.map((plan) => (
          <div 
            key={plan.type}
            className={`rounded-lg shadow-sm border overflow-hidden ${
              plan.recommended ? 'border-primary-400 ring-2 ring-primary-400' : 'border-gray-200'
            }`}
          >
            {plan.recommended && (
              <div className="bg-primary-600 text-white text-center py-1 text-sm font-medium">
                Recommended
              </div>
            )}
            
            <div className="p-6 bg-white">
              <h3 className="text-xl font-display font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingPeriod === 'annually' ? (plan.price * 0.8).toFixed(2) : plan.price}
                </span>
                <span className="ml-1 text-gray-500">/{billingPeriod === 'annually' ? 'year' : 'month'}</span>
              </div>
              
              {billingPeriod === 'annually' && plan.price > 0 && (
                <p className="mt-1 text-xs text-primary-600">
                  Save ${(plan.price * 0.2 * 12).toFixed(2)} per year
                </p>
              )}
              
              <div className="mt-6">
                {isSignedIn ? (
                  <Button
                    variant={plan.recommended ? 'primary' : userPlan.plan === plan.type ? 'outline' : 'secondary'}
                    fullWidth
                    disabled={isLoading || (userPlan.plan === plan.type && plan.type === 'free')}
                    onClick={() => handleSelectPlan(plan.type)}
                  >
                    {isLoading ? 'Processing...' : getButtonText(plan.type)}
                  </Button>
                ) : (
                  <SignUpButton mode="modal">
                    <Button
                      variant={plan.recommended ? 'primary' : 'secondary'}
                      fullWidth
                    >
                      {plan.type === 'free' ? 'Start Free' : 'Sign Up'}
                    </Button>
                  </SignUpButton>
                )}
              </div>
            </div>
            
            <div className="py-6 px-6 bg-gray-50 border-t border-gray-200 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Plan includes:</h4>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available models:</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {plan.models.includes('ninja') ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">Ninja</span>
                  </div>
                  <div className="flex items-center">
                    {plan.models.includes('ghost') ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">Ghost</span>
                  </div>
                  <div className="flex items-center">
                    {plan.models.includes('generator') ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 flex-shrink-0 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">Generator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-display font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-6 grid gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">How does GhostScribe work?</h3>
              <p className="mt-2 text-gray-600">
                GhostScribe uses advanced AI models to transform AI-generated content into text that mimics human writing patterns, including natural variations, errors, and sentence structures that bypass AI detection tools.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Can I upgrade or downgrade my plan?</h3>
              <p className="mt-2 text-gray-600">
                Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference for the remainder of your billing cycle. When downgrading, the new plan will take effect at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">What happens when I reach my word limit?</h3>
              <p className="mt-2 text-gray-600">
                Once you reach your daily word limit, you'll need to wait until it resets at midnight UTC or upgrade to a higher plan with a larger word allowance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Do you offer refunds?</h3>
              <p className="mt-2 text-gray-600">
                We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied with our service, contact our support team within 7 days of your purchase for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;