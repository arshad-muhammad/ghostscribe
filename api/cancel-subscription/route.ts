import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the user's current subscription from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        details: 'User does not have an active subscription'
      }, { status: 400 });
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
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({
      error: 'Failed to cancel subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 