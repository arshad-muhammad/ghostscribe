import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession, cancelSubscription } from '../utils/stripe';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  CheckIcon, 
  SparklesIcon, 
  StarIcon, 
  RocketLaunchIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { useUserPlanStore } from '../store/userPlanStore';
import { formatNextBillingDate } from '../utils/date';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { wordsRemaining, currentPeriodEnd, plan, subscriptionStatus, checkPlanStatus, isLoading, error } = useUserPlanStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Handle successful subscription upgrade
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Successfully upgraded to Pro!');
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  // Add effect to check plan status when component mounts
  useEffect(() => {
    const fetchPlanStatus = async () => {
      try {
        await checkPlanStatus();
        console.log('Plan status checked:', {
          plan,
          currentPeriodEnd,
          wordsRemaining
        });
      } catch (err) {
        console.error('Error checking plan status:', err);
        toast.error('Failed to load subscription details');
      }
    };
    fetchPlanStatus();
  }, [checkPlanStatus]);

  const handleUpgrade = async (billing: 'monthly' | 'annually') => {
    if (!isAuthenticated || !user) {
      navigate(`/register?plan=pro&billing=${billing}`);
      return;
    }

    try {
      console.log('Starting checkout with user:', {
        userDetails: user,
        isAuthenticated,
      });
      await createCheckoutSession('pro', billing);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription process');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      await cancelSubscription();
      toast.success('Subscription cancelled successfully');
      await checkPlanStatus(); // Refresh the plan status
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isPro = plan === 'pro';

  // If user is on pro plan, show pro status instead of pricing
  if (isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-24 sm:py-32 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="p-3 rounded-full bg-primary-50 text-primary-600">
                <SparklesIcon className="h-8 w-8" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              You're on the Pro Plan! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-gray-600"
            >
              Enjoy premium features and unlimited access
            </motion.p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-3xl opacity-10 -mr-20 -mt-20" />
            
            <div className="relative">
              {/* Subscription Status */}
              <motion.div variants={item} className="flex items-center justify-between p-4 bg-primary-50/50 rounded-2xl mb-8">
                <div className="flex items-center">
                  <StarIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Active Subscription</h3>
                    <p className="text-sm text-gray-600">Pro Plan</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  Active
                </span>
              </motion.div>

              {/* Usage Stats */}
              <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center mb-2">
                    <RocketLaunchIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Words Remaining</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{wordsRemaining.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">of 500,000 total words</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Next Billing</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : error ? (
                      <span className="text-red-500">Error loading date</span>
                    ) : (
                      formatNextBillingDate(currentPeriodEnd)
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Subscription renewal</p>
                </div>
              </motion.div>

              {/* Features List */}
              <motion.div variants={item} className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Your Pro Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    '500,000 total words',
                    '5,000 words per day',
                    'Advanced humanization',
                    'Priority support',
                    'Custom templates',
                    'API access'
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center text-gray-600"
                    >
                      <CheckIcon className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={item} className="space-y-4">
                <Button
                  className="w-full bg-primary-600 hover:bg-primary-700 transition-colors duration-300 h-12 text-base font-medium"
                  onClick={() => navigate('/humanizer')}
                >
                  Start Humanizing
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-primary-50/80 transition-colors duration-300 h-12 text-base border-primary-200"
                  onClick={() => navigate('/dashboard')}
                >
                  View Dashboard
                </Button>
                <div className="pt-4 border-t border-gray-200">
                  {plan === 'pro' && subscriptionStatus === 'active' && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 border-red-200 transition-colors duration-300 h-12 text-base"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Cancel Subscription Modal */}
              {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative"
                  >
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>

                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
                        <p className="text-sm text-gray-600">Are you sure you want to cancel your subscription?</p>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 mb-6">
                      <ul className="space-y-2 text-sm text-red-700">
                        <li>• Your subscription will be cancelled immediately</li>
                        <li>• You'll lose access to pro features</li>
                        <li>• Your account will be downgraded to the free plan</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-200"
                        onClick={() => setShowCancelModal(false)}
                      >
                        Keep Subscription
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Regular pricing page for non-pro users
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-24 sm:py-32 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl"
      >
        <div className="mx-auto max-w-4xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block"
          >
            <span className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20 mb-6">
              Simple pricing, powerful features
            </span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-base font-semibold leading-7 text-primary-600 tracking-wide uppercase"
          >
            Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400"
          >
            Choose the right plan for you
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Whether you're just starting out or scaling up, we have a plan that's right for you
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto grid max-w-lg grid-cols-1 items-center gap-8 lg:max-w-none lg:grid-cols-2"
        >
          {/* Free Tier */}
          <motion.div 
            variants={item}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Free</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">$0</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600 ml-1">/month</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  Perfect for trying out GhostScribe
                </p>
              </div>

              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center rounded-full bg-primary-50/60 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/20">
                  Most popular
                </span>
              </div>

              <ul role="list" className="mt-8 space-y-4 text-sm leading-6 text-gray-600 mb-8">
                {['1,000 words per month', 'Basic text humanization', 'Standard support'].map((feature, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-x-3 items-center"
                  >
                    <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  variant="outline"
                  className="mt-8 w-full hover:bg-primary-50 transition-colors duration-300 h-12 text-base"
                  onClick={() => navigate('/register')}
                  disabled={isAuthenticated}
                >
                  {isAuthenticated ? 'Current Plan' : 'Get started for free'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            variants={item}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative rounded-3xl p-8 xl:p-10 bg-white shadow-xl transition-all duration-300 overflow-hidden"
          >
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-400 [mask-image:linear-gradient(white,transparent)]" />
            
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-50" />
            
            <div className="relative">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">Pro</h3>
                  <span className="inline-flex items-center rounded-full bg-primary-100/80 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    Best value
                  </span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">$9.99</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600 ml-1">/month</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  Perfect for professionals and teams
                </p>
              </div>

              <ul role="list" className="mt-8 space-y-4 text-sm leading-6 text-gray-600 mb-8">
                {[
                  '500,000 words',
                  'Advanced humanization options',
                  'Priority support',
                  'Custom templates',
                  'API access'
                ].map((feature, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-x-3 items-center"
                  >
                    <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary-600" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="space-y-4 mt-8">
                <Button
                  className="w-full bg-primary-600 hover:bg-primary-700 transition-colors duration-300 h-12 text-base font-medium"
                  onClick={() => handleUpgrade('monthly')}
                  disabled={isPro}
                >
                  {isPro ? 'Current Plan' : 'Upgrade Monthly'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-primary-50/80 transition-colors duration-300 h-12 text-base border-primary-200"
                  onClick={() => handleUpgrade('annually')}
                  disabled={isPro}
                >
                  {isPro ? 'Current Plan' : 'Upgrade Annually (Save 20%)'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PricingPage;