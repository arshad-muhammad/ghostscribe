-- Add subscription-related columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.plan IS 'The subscription plan (free, pro, etc.)';
COMMENT ON COLUMN profiles.billing_period IS 'The billing period (monthly, annually)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'The Stripe customer ID';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'The Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'The subscription status (active, inactive, cancelled)';
COMMENT ON COLUMN profiles.updated_at IS 'The last time the profile was updated'; 