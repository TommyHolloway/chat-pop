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

// Enhanced AES encryption with proper key management
async function encryptApiKeySecurely(apiKey: string, userSalt: string): Promise<{
  encryptedKey: string;
  keyHash: string;
}> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Derive key from user salt and environment secret
  const envSecret = Deno.env.get('ENCRYPTION_SECRET') || 'default-dev-secret-change-in-prod';
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(envSecret + userSalt),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive encryption key
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
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the API key
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(apiKey)
  );
  
  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv, 0);
  combined.set(encryptedArray, iv.length);
  
  // Create hash for identification
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey.substring(0, 8)));
  const keyHashHex = Array.from(new Uint8Array(keyHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return {
    encryptedKey: btoa(String.fromCharCode(...combined)),
    keyHash: keyHashHex
  };
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting and logging
    const clientIpHeader = req.headers.get('x-forwarded-for') || 
                           req.headers.get('x-real-ip') || 
                           'unknown';
    
    // Parse IP safely
    const { data: clientIp } = await supabase.rpc('parse_client_ip', {
      ip_header: clientIpHeader
    });
    
    const rateLimitKey = clientIp?.toString() || clientIpHeader;
    
    // Apply rate limiting
    if (!checkRateLimit(rateLimitKey)) {
      // Log potential abuse
      await supabase.from('activity_logs').insert({
        action: 'SECURITY_VIOLATION: API key encryption rate limit exceeded',
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent'),
        details: { 
          endpoint: 'secure-encrypt-api-key',
          violation_type: 'rate_limit_exceeded'
        }
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Rate limit exceeded. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { api_key, user_id, agent_id } = body;
    
    // Input validation
    if (!api_key || typeof api_key !== 'string') {
      throw new Error('Valid API key is required');
    }
    
    if (!user_id || !agent_id) {
      throw new Error('User ID and Agent ID are required');
    }
    
    if (api_key.length > 500) {
      throw new Error('API key too long');
    }
    
    // Basic validation to ensure it looks like an API key
    if (!/^[a-zA-Z0-9\-_.]+$/.test(api_key)) {
      throw new Error('Invalid API key format');
    }

    // Create user salt from user ID and agent ID
    const userSalt = `${user_id}-${agent_id}`;
    
    // Encrypt the API key using enhanced security
    const { encryptedKey, keyHash } = await encryptApiKeySecurely(api_key, userSalt);

    // Store encrypted key securely
    const { error: storageError } = await supabase
      .from('api_key_storage')
      .upsert({
        user_id,
        agent_id,
        encrypted_key: encryptedKey,
        key_hash: keyHash,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,agent_id'
      });

    if (storageError) {
      throw new Error('Failed to store encrypted key');
    }

    // Log successful encryption (without the actual keys)
    await supabase.from('activity_logs').insert({
      action: 'API_KEY_ENCRYPTED_SECURE',
      user_id,
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent'),
      details: { 
        endpoint: 'secure-encrypt-api-key',
        agent_id,
        key_hash_preview: keyHash.substring(0, 8)
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      key_id: keyHash.substring(0, 8), // Return partial hash for identification
      message: 'API key encrypted and stored securely'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Log error without exposing sensitive details
    try {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await supabase.from('activity_logs').insert({
        action: 'API_KEY_ENCRYPTION_ERROR_SECURE',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        details: { 
          endpoint: 'secure-encrypt-api-key',
          error_type: errorMsg.includes('required') ? 'validation_error' : 'encryption_error'
        }
      });
    } catch (logError) {
      // Silently fail on logging errors
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unable to securely store API key. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});