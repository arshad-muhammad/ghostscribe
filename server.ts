import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Clerk } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Clerk with proper error handling
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing Clerk Secret Key');
}

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const app = express();
const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL,
  credentials: true,
}));

// Type definitions
type StripeSubscription = Stripe.Subscription & {
  current_period_end: number;
};

interface StripeError {
  raw?: {
    message?: string;
    code?: string;
  };
}

interface ExtendedRequest extends Request {
  rawBody?: string;
}

app.use(express.json({
  verify: (req: ExtendedRequest, _res: Response, buf: Buffer) => {
    if (req.originalUrl?.startsWith('/api/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));

// Create checkout session endpoint
const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { priceId, planType, billingPeriod, userId } = req.body;
    
    console.log('Creating checkout session with:', { 
      priceId, 
      planType, 
      billingPeriod, 
      userId,
      appUrl: process.env.VITE_APP_URL,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    });

    // Validate required fields
    if (!priceId) {
      throw new Error('Price ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!planType) {
      throw new Error('Plan type is required');
    }
    if (!process.env.VITE_APP_URL) {
      throw new Error('VITE_APP_URL environment variable is not set');
    }

    // Verify user exists in Clerk
    try {
      const user = await clerk.users.getUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check if user is already on pro plan
      const currentPlan = user.privateMetadata.plan;
      if (currentPlan === 'pro' && planType === 'pro') {
        throw new Error('User is already on the Pro plan');
      }

      console.log('Current user plan:', {
        userId,
        currentPlan,
        requestedPlan: planType
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      throw new Error(`Failed to verify user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate the price ID exists in Stripe
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price || price.active === false) {
        throw new Error(`Invalid or inactive price ID: ${priceId}`);
      }
    } catch (error) {
      console.error('Error validating price ID:', error);
      throw new Error(`Invalid price ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        planType,
        billingPeriod,
      },
      client_reference_id: userId,
    });

    console.log('Successfully created checkout session:', {
      sessionId: session.id,
      url: session.url,
      userId,
      planType
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    const stripeError = error as StripeError;
    console.error('Error creating checkout session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      stripeError: stripeError.raw,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
      details: stripeError.raw?.message || (error instanceof Error ? error.message : 'Unknown error'),
      code: stripeError.raw?.code || 'unknown'
    });
  }
};

// Stripe webhook handler
const handleWebhook = async (req: ExtendedRequest, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!sig || !webhookSecret) {
      console.error('Missing webhook signature or secret:', { sig, webhookSecret: !!webhookSecret });
      throw new Error('Missing stripe signature or webhook secret');
    }

    if (!req.rawBody) {
      throw new Error('Missing request body');
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );

    console.log('Received Stripe webhook event:', {
      type: event.type,
      id: event.id,
      object: event.object
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Processing checkout session:', {
          sessionId: session.id,
          metadata: session.metadata,
          subscription: session.subscription
        });
        
        if (typeof session.subscription !== 'string') {
          throw new Error('Invalid subscription ID');
        }

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as StripeSubscription;
        
        // Get the current period end timestamp
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        console.log('Retrieved subscription:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          periodEnd
        });
        
        // Get user data from metadata
        const { userId, planType } = session.metadata || {};
        
        if (userId && planType) {
          try {
            console.log('Updating Clerk user metadata:', {
              userId,
              planType,
              subscriptionId: subscription.id
            });

            // First, verify the user exists
            const user = await clerk.users.getUser(userId);
            if (!user) {
              throw new Error(`User ${userId} not found in Clerk`);
            }

            // Update user's Clerk metadata
            const updateResult = await clerk.users.updateUser(userId, {
              privateMetadata: {
                plan: planType,
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                currentPeriodEnd: periodEnd,
              },
            });

            console.log('Successfully updated user profile:', {
              userId,
              planType,
              subscriptionId: subscription.id,
              status: subscription.status,
              updateResult: {
                privateMetadata: updateResult.privateMetadata
              }
            });

            // Verify the update
            const updatedUser = await clerk.users.getUser(userId);
            console.log('Verified user metadata after update:', {
              userId,
              privateMetadata: updatedUser.privateMetadata
            });
          } catch (error) {
            console.error('Error updating user profile:', error);
            console.error('Full error details:', {
              error,
              userId,
              planType,
              subscriptionId: subscription.id
            });
          }
        } else {
          console.error('Missing required metadata:', {
            sessionId: session.id,
            metadata: session.metadata
          });
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the current period end timestamp
        const subscriptionData = subscription as unknown as { current_period_end: number };
        const periodEnd = new Date(subscriptionData.current_period_end * 1000).toISOString();
        
        // Get the user ID from the metadata
        const userId = subscription.metadata.userId;
        
        if (userId) {
          try {
            // Update user's Clerk metadata
            await clerk.users.updateUser(userId, {
              privateMetadata: {
                plan: subscription.status === 'active' ? 'pro' : 'free',
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                currentPeriodEnd: periodEnd,
              },
            });

            console.log('Successfully updated subscription status:', {
              userId,
              subscriptionId: subscription.id,
              status: subscription.status,
              periodEnd
            });
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Cancel subscription endpoint
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update user's Clerk metadata
    if (userId) {
      await clerk.users.updateUser(userId, {
        privateMetadata: {
          plan: 'free',
          subscriptionStatus: 'canceled',
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        },
      });
    }

    res.json({ subscription });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// Check plan status endpoint
const checkPlanStatus = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      throw new Error('Missing required parameters');
    }

    console.log('Checking plan status for:', { userId, sessionId });

    // First, verify the user exists
    const user = await clerk.users.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // If the session is not paid, return early
    if (session.payment_status !== 'paid') {
      return res.json({
        success: false,
        message: 'Payment not completed',
        status: session.payment_status
      });
    }

    // Get the subscription
    if (typeof session.subscription !== 'string') {
      throw new Error('Invalid subscription data');
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription) as StripeSubscription;
    
    // Get the current period end timestamp
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Update the user's metadata in Clerk
    const updateResult = await clerk.users.updateUser(userId, {
      privateMetadata: {
        plan: 'pro',
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: periodEnd,
      },
    });

    console.log('Updated user profile:', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      metadata: updateResult.privateMetadata
    });

    res.json({
      success: true,
      plan: 'pro',
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: periodEnd
    });
  } catch (error) {
    console.error('Error checking plan status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Register routes using Router
router.post('/api/create-checkout-session', createCheckoutSession);
router.post('/api/webhook', handleWebhook);
router.post('/api/check-plan-status', checkPlanStatus);

// Use the router
app.use(router);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the Express app for Vercel
export default app; 