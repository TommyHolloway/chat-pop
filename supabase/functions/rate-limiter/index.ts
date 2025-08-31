import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key, maxRequests = 100, windowMs = 60000 } = await req.json();

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Rate limit key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Date.now();
    const record = rateLimitStore.get(key);

    // If no record or window expired, create new record
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          count: 1, 
          remaining: maxRequests - 1,
          resetTime: now + windowMs 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          count: record.count,
          remaining: 0,
          resetTime: record.resetTime,
          error: 'Rate limit exceeded'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment counter
    record.count++;
    
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        count: record.count,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});