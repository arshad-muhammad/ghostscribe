import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getAuthHeader } from '../../../lib/headers';
import { NextResponse } from 'next/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil' as const,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ghostscribe.xyz',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request) {
  // Log request details for debugging
  console.log('Received request:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers)
  });

  try {
    // Get request body
    const body = await request.json().catch(() => ({}));
    const { priceId, planType, billingPeriod, userId } = body;
    
    console.log('Request body:', { priceId, planType, billingPeriod, userId });

    if (!userId || !priceId || !planType || !billingPeriod) {
      console.error('Missing required fields:', { userId, priceId, planType, billingPeriod });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          received: { userId, priceId, planType, billingPeriod }
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return NextResponse.json(
        { error: 'No authorization header or invalid header format' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Extract token from Authorization header
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Invalid Authorization header format');
      return NextResponse.json(
        { error: 'Invalid Authorization header format' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid token', details: authError?.message },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify user exists and create checkout session
    try {
      const userProfile = await verifyUserInDatabase(userId);
      console.log('User profile found:', userProfile);

      const session = await stripe.checkout.sessions.create({
        customer_email: userProfile.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL}/pricing`,
        metadata: { userId, planType, billingPeriod },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        client_reference_id: userId
      });

      console.log('Stripe session created:', {
        sessionId: session.id,
        hasUrl: !!session.url
      });

      if (!session.url) {
        throw new Error('No checkout URL returned from Stripe');
      }

      return NextResponse.json({ url: session.url }, { headers: corsHeaders });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 