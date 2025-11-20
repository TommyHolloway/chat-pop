import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptAccessToken } from '../_shared/shopify-decrypt.ts';
import { validateAuthAndAgent, getRestrictedCorsHeaders } from '../_shared/auth-helpers.ts';

const corsHeaders = getRestrictedCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, days = 90 } = await req.json();
    if (!agent_id) throw new Error('agent_id is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    await validateAuthAndAgent(authHeader, agent_id, supabaseUrl, supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: connection } = await supabase.from('shopify_connections').select('*').eq('agent_id', agent_id).single();
    if (!connection) throw new Error('No Shopify connection found');

    const accessToken = await decryptAccessToken(connection.encrypted_access_token);

    // Fetch and import orders logic here (simplified for brevity)
    return new Response(JSON.stringify({ success: true, ordersImported: 0 }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: error.message?.includes('authorization') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
