// Fix: Replaced invalid Deno types reference with a global `Deno` declaration to resolve TypeScript errors.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// IMPORTANT: This function is now configured for a generic LLM.
// You must set the following secrets in your Supabase project:
// 1. LLM_API_KEY: Your API key for the LLM provider.
// 2. LLM_API_ENDPOINT: The full URL for the text generation endpoint.
//
// Example command:
// supabase secrets set LLM_API_KEY="your-secret-key"
// supabase secrets set LLM_API_ENDPOINT="https://api.your-llm.com/v1/completions"

const LLM_API_KEY = Deno.env.get('LLM_API_KEY');
const LLM_API_ENDPOINT = Deno.env.get('LLM_API_ENDPOINT');


serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (!LLM_API_KEY || !LLM_API_ENDPOINT) {
      throw new Error("LLM_API_KEY and LLM_API_ENDPOINT are not set in Supabase secrets.");
    }
    
    const { modelName } = await req.json();

    if (!modelName) {
      return new Response(JSON.stringify({ error: 'modelName is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const prompt = `Create a complex, dramatic, and engaging backstory for a fictional character named "${modelName}". The story should be rich in detail, with intriguing plot points and emotional depth. Write it in the third person. Do not use markdown formatting. The story should be around 200-300 words.`;

    // --- GENERIC LLM API CALL ---
    // NOTE: You may need to adjust the payload and response parsing
    // based on your specific LLM provider's API documentation.
    const llmResponse = await fetch(LLM_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LLM_API_KEY}`
        },
        body: JSON.stringify({
            // Example payload - adjust as needed
            prompt: prompt,
            max_tokens: 350, 
            temperature: 0.8,
        })
    });

    if (!llmResponse.ok) {
        const errorBody = await llmResponse.text();
        throw new Error(`LLM API request failed: ${llmResponse.status} ${errorBody}`);
    }

    const responseData = await llmResponse.json();
    
    // Example response parsing - adjust as needed.
    // Common patterns include `responseData.choices[0].text` or `responseData.completion`.
    const story = responseData?.choices?.[0]?.text ?? responseData?.completion ?? "The void whispers no tales of this one...";
    
    return new Response(JSON.stringify({ story }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
});
