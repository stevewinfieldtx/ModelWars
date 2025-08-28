import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Securely read credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PRICE_ID = process.env.VITE_STRIPE_PRICE_ID;

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

export const IS_CONFIGURED = supabaseUrl && supabaseAnonKey;
export const IS_STRIPE_CONFIGURED = STRIPE_PUBLISHABLE_KEY && STRIPE_PRICE_ID;

if (!IS_CONFIGURED) {
  console.error("Supabase credentials are not configured. Please create a .env.local file and add your Supabase URL and public anon key.");
}

if (!IS_STRIPE_CONFIGURED) {
    console.error("Stripe is not configured. Please add your Stripe Publishable Key and Price ID to your .env.local file.");
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