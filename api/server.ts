import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables
config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

// Initialize Express
const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil' as const,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://ghostscribe.xyz'
    : 'http://localhost:5173',
  credentials: true
}));

// Basic authentication middleware
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = { userId: user.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Verify user exists in database
const verifyUserInDatabase = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User not found in database');
  }

  return profile;
};

// Prefix all routes with /api
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Create checkout session endpoint
router.post('/create-checkout-session', authenticateUser, async (req, res) => {
  try {
    const { priceId, planType, billingPeriod, userId } = req.body;
    
    if (!userId || !priceId || !planType || !billingPeriod) {
      res.status(400).json({
        error: 'Missing required fields',
        received: { userId, priceId, planType, billingPeriod }
      });
      return;
    }

    // Verify user exists
    const userProfile = await verifyUserInDatabase(userId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userProfile.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/pricing`,
      metadata: { userId, planType, billingPeriod }
    });

    if (!session.url) {
      throw new Error('No checkout URL returned from Stripe');
    }

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel subscription endpoint
router.post('/cancel-subscription', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get the user's current subscription from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.subscription_id) {
      res.status(400).json({ 
        error: 'No active subscription found',
        details: 'User does not have an active subscription'
      });
      return;
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(profile.subscription_id);

    // Update the user's profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
        subscription_id: null,
        subscription_status: 'canceled',
        current_period_end: null,
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Use the router with /api prefix
app.use('/api', router);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404s
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Export the Express app
export default app;

// Start the server if we're not in production (Vercel will handle this in production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
    🚀 Server is running!
    ⭐️ NODE_ENV: ${process.env.NODE_ENV}
    🔗 API URL: http://localhost:${PORT}
    `);
  });
} 