import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enhanced AES decryption with proper key management
async function decryptApiKeySecurely(encryptedKey: string, userSalt: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Decode the base64 encoded data
    const combined = new Uint8Array(
      atob(encryptedKey).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedArray = combined.slice(12);
    
    // Derive the same key used for encryption
    const envSecret = Deno.env.get('ENCRYPTION_SECRET') || 'default-dev-secret-change-in-prod';
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(envSecret + userSalt),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive decryption key (same as encryption)
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(userSalt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedArray
    );
    
    return decoder.decode(decrypted);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to decrypt API key: ' + errorMsg);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, agent_id } = body;
    
    if (!user_id || !agent_id) {
      throw new Error('User ID and Agent ID are required');
    }

    // Retrieve encrypted key from secure storage
    const { data: keyData, error: retrievalError } = await supabase
      .from('api_key_storage')
      .select('encrypted_key, key_hash')
      .eq('user_id', user_id)
      .eq('agent_id', agent_id)
      .single();

    if (retrievalError || !keyData) {
      throw new Error('API key not found or access denied');
    }

    // Create user salt (same as used for encryption)
    const userSalt = `${user_id}-${agent_id}`;
    
    // Decrypt the API key
    const decryptedKey = await decryptApiKeySecurely(keyData.encrypted_key, userSalt);

    // Log access for audit (without exposing the actual key)
    const clientIpHeader = req.headers.get('x-forwarded-for') || 
                           req.headers.get('x-real-ip') || 
                           'unknown';
    
    const { data: clientIp } = await supabase.rpc('parse_client_ip', {
      ip_header: clientIpHeader
    });

    await supabase.from('activity_logs').insert({
      action: 'API_KEY_DECRYPTED_SECURE',
      user_id,
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent'),
      details: { 
        endpoint: 'secure-decrypt-api-key',
        agent_id,
        key_hash_preview: keyData.key_hash.substring(0, 8)
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      decrypted_key: decryptedKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log error without exposing sensitive details
    try {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await supabase.from('activity_logs').insert({
        action: 'API_KEY_DECRYPTION_ERROR_SECURE',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        details: { 
          endpoint: 'secure-decrypt-api-key',
          error_type: errorMsg.includes('required') ? 'validation_error' : 'decryption_error'
        }
      });
    } catch (logError) {
      // Silently fail on logging errors
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});