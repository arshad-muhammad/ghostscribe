import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create a separate client for auth operations
const supabaseAuth = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ghostscribe.xyz']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic authentication middleware
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('No authorization header provided');
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token provided in authorization header');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify the token using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError) {
      console.error('Token verification failed:', authError);
      res.status(401).json({ error: 'Invalid token', details: authError.message });
      return;
    }

    if (!user) {
      console.error('No user found for token');
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Verify the user exists in the database using the admin client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', { userId: user.id, error: profileError });
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    // Add user info to request
    req.user = { userId: user.id };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
    console.log('Received checkout request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const { priceId, planType, billingPeriod, userId } = req.body;
    
    if (!userId || !priceId || !planType || !billingPeriod) {
      console.error('Missing required fields:', {
        userId,
        priceId,
        planType,
        billingPeriod,
        body: req.body
      });
      res.status(400).json({
        error: 'Missing required fields',
        received: { userId, priceId, planType, billingPeriod }
      });
      return;
    }

    // Verify the requesting user matches the userId
    if (req.user?.userId !== userId) {
      console.error('User ID mismatch:', {
        requestUserId: req.user?.userId,
        bodyUserId: userId
      });
      res.status(403).json({
        error: 'User ID mismatch',
        message: 'The authenticated user does not match the requested user ID'
      });
      return;
    }

    // Verify user exists
    console.log('Verifying user in database:', userId);
    const userProfile = await verifyUserInDatabase(userId);
    console.log('User profile found:', userProfile);

    // Create checkout session
    console.log('Creating Stripe checkout session with:', {
      email: userProfile.email,
      priceId,
      planType,
      billingPeriod
    });

    const session = await stripe.checkout.sessions.create({
      customer_email: userProfile.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/pricing`,
      metadata: { userId, planType, billingPeriod }
    });

    if (!session.url) {
      console.error('No checkout URL in session:', session);
      throw new Error('No checkout URL returned from Stripe');
    }

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
      user: req.user
    });
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
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