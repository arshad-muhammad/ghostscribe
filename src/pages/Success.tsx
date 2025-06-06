import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          setError('No session ID found');
          setStatus('error');
          return;
        }

        // Verify the session with our backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = 'Failed to verify payment';
          
          if (contentType?.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.details || error.message || error.error || errorMessage;
            console.error('Server error details:', error);
          } else {
            const textError = await response.text();
            console.error('Non-JSON error response:', textError);
            errorMessage = `Server error (${response.status}): Please ensure the server is running`;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Payment verification successful:', data);

        setStatus('success');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error instanceof Error ? error.message : 'Failed to verify payment');
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="mb-6"
            >
              <img src="/ghost-icon.svg" alt="Ghost" className="w-16 h-16 mx-auto opacity-70" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Verifying your payment...</h2>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"
            />
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <img src="/ghost-icon.svg" alt="Ghost" className="w-16 h-16 mx-auto opacity-70 grayscale" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-semibold mb-4 text-red-600"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              Payment Verification Failed
            </motion.h2>
            <p className="text-gray-600 mb-6">{error || 'Please try again or contact support'}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Return to Pricing
            </motion.button>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6
              }}
              className="mb-6"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <img src="/ghost-icon.svg" alt="Ghost" className="w-16 h-16 mx-auto" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Payment Successful!
              </h2>
              <p className="text-gray-600">Redirecting you to the dashboard...</p>
              <motion.div
                className="mt-4 flex justify-center space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary-400"
                    animate={{
                      y: ["0%", "-50%", "0%"],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 