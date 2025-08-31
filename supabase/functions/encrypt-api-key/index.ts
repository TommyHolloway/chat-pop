import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for logging
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AES encryption using Web Crypto API
async function encryptApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Generate a random key for encryption
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the API key
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  // For demo purposes, we'll return a base64 encoded version
  // In production, you'd store the key securely and return just the encrypted data + iv
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv, 0);
  combined.set(encryptedArray, iv.length);
  
  return btoa(String.fromCharCode(...combined));
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
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Apply rate limiting
    if (!checkRateLimit(clientIp)) {
      // Log potential abuse
      await supabase.from('activity_logs').insert({
        action: 'SECURITY_VIOLATION: API key encryption rate limit exceeded',
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent'),
        details: { 
          endpoint: 'encrypt-api-key',
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
    const { api_key } = body;
    
    // Input validation
    if (!api_key || typeof api_key !== 'string') {
      throw new Error('Valid API key is required');
    }
    
    if (api_key.length > 500) {
      throw new Error('API key too long');
    }
    
    // Basic validation to ensure it looks like an API key
    if (!/^[a-zA-Z0-9\-_.]+$/.test(api_key)) {
      throw new Error('Invalid API key format');
    }

    // Encrypt the API key using proper AES encryption
    const encrypted_key = await encryptApiKey(api_key);

    // Log successful encryption (without the actual keys)
    await supabase.from('activity_logs').insert({
      action: 'API_KEY_ENCRYPTED',
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent'),
      details: { 
        endpoint: 'encrypt-api-key',
        key_length: api_key.length
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      encrypted_key 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error encrypting API key:', error);
    
    // Log error without exposing sensitive details
    try {
      await supabase.from('activity_logs').insert({
        action: 'API_KEY_ENCRYPTION_ERROR',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        details: { 
          endpoint: 'encrypt-api-key',
          error_type: error.message.includes('required') ? 'validation_error' : 'encryption_error'
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Encryption failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});