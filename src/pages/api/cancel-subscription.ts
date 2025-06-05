import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@clerk/nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = auth();
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get customer's subscription
    const customer = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${userId}'`,
    });

    if (!customer.data.length) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.data[0].id,
      status: 'active',
    });

    if (!subscriptions.data.length) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription at period end
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    return res.status(200).json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
} 