import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, details, ip_address, user_agent, severity = 'info' } = await req.json();

    // Validate required fields
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log security event
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        action: `SECURITY_${severity.toUpperCase()}: ${action}`,
        details: details || {},
        ip_address: ip_address || req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: user_agent || req.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log security event:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log security event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for suspicious patterns
    if (severity === 'critical' || severity === 'error') {
      // Additional alerting could be implemented here
      console.warn(`SECURITY ALERT: ${action}`, details);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security monitor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});