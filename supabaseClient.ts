import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Provide placeholder values to prevent the app from crashing if env vars are not set.
// The app will show a configuration error screen until these are replaced.
const PLACEHOLDER_SUPABASE_URL = 'https://your-project-url.supabase.co';
const PLACEHOLDER_SUPABASE_KEY = 'your-public-anon-key';
const PLACEHOLDER_STRIPE_KEY = 'pk_test_your-stripe-publishable-key';
const PLACEHOLDER_PRICE_ID = 'price_your-stripe-price-id';


// Securely read credentials from environment variables, with fallbacks to placeholders
const supabaseUrl = process.env.VITE_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || PLACEHOLDER_SUPABASE_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY || PLACEHOLDER_STRIPE_KEY;
export const STRIPE_PRICE_ID = process.env.VITE_STRIPE_PRICE_ID || PLACEHOLDER_PRICE_ID;

// ==========================================
// INSTRUCTIONS:
// 1. Create a `.env.local` file in your project root.
// 2. Add your keys there:
//    VITE_SUPABASE_URL="YOUR_URL"
//    VITE_SUPABASE_ANON_KEY="YOUR_KEY"
//    VITE_STRIPE_PUBLISHABLE_KEY="YOUR_KEY"
//    VITE_STRIPE_PRICE_ID="YOUR_PRICE_ID"
// 3. Add the same variables to your hosting provider (e.g., Vercel).
// ==========================================

// Check if the placeholder values are still being used.
export const IS_CONFIGURED = supabaseUrl !== PLACEHOLDER_SUPABASE_URL && supabaseAnonKey !== PLACEHOLDER_SUPABASE_KEY;
export const IS_STRIPE_CONFIGURED = STRIPE_PUBLISHABLE_KEY !== PLACEHOLDER_STRIPE_KEY && STRIPE_PRICE_ID !== PLACEHOLDER_PRICE_ID;

if (!IS_CONFIGURED) {
  console.warn("Supabase credentials are not configured. The app is running with placeholder values. Please create a .env.local file and add your Supabase URL and public anon key.");
}

if (!IS_STRIPE_CONFIGURED) {
    console.warn("Stripe is not configured. The app is running with placeholder values. Please add your Stripe Publishable Key and Price ID to your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise && IS_STRIPE_CONFIGURED) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};


export const BUCKET_NAME = 'model-images';
export const NSFW_BUCKET_NAME = 'model-images-nsfw';