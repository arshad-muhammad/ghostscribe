import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = Clerk({ secretKey: import.meta.env.VITE_CLERK_SECRET_KEY });
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateUserPlan(userId: string, planData: { 
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  try {
    await clerk.users.updateUser(userId, {
      publicMetadata: planData
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error verifying webhook signature:', error);
        return res.status(400).json({ error: `Webhook Error: ${error.message}` });
      }
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, planType } = session.metadata!;

        // Update user to pro plan
        await updateUserPlan(userId, {
          plan: planType,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer && customer.metadata.clerk_user_id) {
          const userId = customer.metadata.clerk_user_id;
          
          // If subscription is past due or unpaid, downgrade to free
          if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            await updateUserPlan(userId, {
              plan: 'free',
              stripeCustomerId: null,
              stripeSubscriptionId: null,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('metadata' in customer && customer.metadata.clerk_user_id) {
          const userId = customer.metadata.clerk_user_id;
          
          // Reset user to free plan
          await updateUserPlan(userId, {
            plan: 'free',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
} 