import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession } from '../utils/stripe';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Ghost, Mail, Lock, AlertTriangle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithGoogle, isAuthenticated, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const { user } = await register(email, password);
      if (!user) {
        throw new Error('Registration failed');
      }

      const plan = searchParams.get('plan');
      const billing = searchParams.get('billing') as 'monthly' | 'annually';

      if (plan === 'pro') {
        try {
          await createCheckoutSession('pro', billing || 'monthly', user.id);
        } catch (err) {
          console.error('Error creating checkout session:', err);
          toast.error('Failed to start subscription process');
          navigate('/pricing');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { user } = await loginWithGoogle();
      if (!user) {
        throw new Error('Google sign up failed');
      }

      const plan = searchParams.get('plan');
      const billing = searchParams.get('billing') as 'monthly' | 'annually';

      if (plan === 'pro') {
        try {
          await createCheckoutSession('pro', billing || 'monthly', user.id);
        } catch (err) {
          console.error('Error creating checkout session:', err);
          toast.error('Failed to start subscription process');
          navigate('/pricing');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google sign up failed');
    }
  };

  if (isAuthenticated) {
    return null; // Will be redirected by the handlers
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Ghost className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-4 text-3xl font-display font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your journey with GhostScribe
          </p>
        </div>

        {error && (
          <div className="p-3 bg-error-50 border border-error-300 text-error-700 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="group relative"
            >
              Create account
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              fullWidth
              isLoading={isLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M12.545, 10.239v3.821h5.445c-0.712, 2.315-2.647, 3.972-5.445, 3.972-3.332, 0-6.033-2.701-6.033-6.032s2.701-6.032, 6.033-6.032c1.498, 0, 2.866, 0.549, 3.921, 1.453l2.814-2.814C17.503, 2.988, 15.139, 2, 12.545, 2 7.021, 2, 2.543, 6.477, 2.543, 12s4.478, 10, 10.002, 10c8.396, 0, 10.249-7.85, 9.426-11.748l-9.426, -0.013z"
                  fill="#4285F4"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;