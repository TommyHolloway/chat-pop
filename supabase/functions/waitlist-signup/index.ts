import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaitlistRequest {
  email: string;
  phone: string;
  opt_in_for_texts: boolean;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, phone, opt_in_for_texts, source }: WaitlistRequest = await req.json();

    // Validation
    if (!email || !email.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone || !phone.trim()) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phone format validation (must start with +)
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Must include country code (e.g., +1)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting context
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    console.log('Waitlist signup attempt:', {
      email: email.substring(0, 3) + '***',
      phone: phone.substring(0, 5) + '***',
      source,
      ip: clientIp
    });

    // Check for duplicate email
    const { data: existing, error: checkError } = await supabaseClient
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking duplicate:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Email already registered on waitlist' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert waitlist entry
    const { error: insertError } = await supabaseClient
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        opt_in_for_texts: opt_in_for_texts || false,
        source: source || 'unknown',
        metadata: {
          ip: clientIp,
          user_agent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('Error inserting waitlist entry:', insertError);
      
      if (insertError.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to join waitlist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Waitlist signup successful:', email.substring(0, 3) + '***');

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully joined waitlist' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
