import React, { useEffect } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession } from '../utils/stripe';
import { toast } from 'sonner';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleRegistrationComplete = async () => {
      const plan = searchParams.get('plan');
      const billing = searchParams.get('billing') as 'monthly' | 'annually';

      if (isAuthenticated && plan === 'pro') {
        try {
          await createCheckoutSession('pro', billing || 'monthly');
        } catch (err) {
          console.error('Error creating checkout session:', err);
          toast.error('Failed to start subscription process');
          navigate('/pricing');
        }
      } else if (isAuthenticated) {
        navigate('/dashboard');
      }
    };

    handleRegistrationComplete();
  }, [isAuthenticated, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start your journey with GhostScribe
          </p>
        </div>
        <SignUp 
          afterSignUpUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "rounded-lg shadow-md",
            }
          }}
        />
      </div>
    </div>
  );
};

export default RegisterPage;