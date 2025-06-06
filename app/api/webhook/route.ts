import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil' as const,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to safely get subscription end date
// Note: Using any type here as a temporary solution due to Stripe types not properly exposing current_period_end
// TODO: Update this when Stripe types are fixed or when we find a better typing solution
const getSubscriptionEndDate = (subscription: any): string => {
  return new Date(subscription.current_period_end * 1000).toISOString();
};

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe-signature or webhook secret');
    }

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(
      JSON.stringify({
        error: 'Webhook signature verification failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.subscription) {
          // Retrieve the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Update the user's profile with their subscription info
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_id: subscription.id,
              subscription_status: subscription.status,
              current_period_end: getSubscriptionEndDate(subscription),
              plan: session.metadata?.planType || 'pro'
            })
            .eq('id', session.metadata?.userId);

          if (updateError) {
            console.error('Error updating user profile:', updateError);
            throw updateError;
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          // Update the subscription period end date
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              current_period_end: getSubscriptionEndDate(subscription),
              subscription_status: subscription.status
            })
            .eq('subscription_id', subscription.id);

          if (updateError) {
            console.error('Error updating subscription period:', updateError);
            throw updateError;
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update the user's profile when their subscription is cancelled
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_id: null,
            subscription_status: 'canceled',
            current_period_end: null,
            plan: 'free'
          })
          .eq('subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating cancelled subscription:', updateError);
          throw updateError;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update the subscription status and period end
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: getSubscriptionEndDate(subscription)
          })
          .eq('subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription status:', updateError);
          throw updateError;
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://ghostscribe.xyz',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
      'Access-Control-Max-Age': '86400'
    }
  });
} 