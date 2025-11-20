import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface AuthValidationResult {
  userId: string;
  agentId: string;
  isAuthorized: boolean;
}

/**
 * Validates authentication and agent ownership
 * @param authHeader - Authorization header from request
 * @param agentId - Agent ID to validate ownership of
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase service role key
 * @returns AuthValidationResult with user and authorization status
 * @throws Error if authentication fails or agent ownership cannot be verified
 */
export async function validateAuthAndAgent(
  authHeader: string | null,
  agentId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<AuthValidationResult> {
  // Validate authorization header exists
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  // Extract token from Bearer header
  const token = authHeader.replace('Bearer ', '');
  if (!token || token === authHeader) {
    throw new Error('Invalid authorization header format');
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('Invalid authentication token');
  }

  // Validate agent ID is provided
  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  // Verify user owns the agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, user_id')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    throw new Error('Agent not found');
  }

  if (agent.user_id !== user.id) {
    throw new Error('Unauthorized: You do not own this agent');
  }

  return {
    userId: user.id,
    agentId: agent.id,
    isAuthorized: true,
  };
}

/**
 * Get CORS headers with restricted origin for internal functions
 * @param allowedOrigin - Optional specific origin to allow (defaults to APP_URL env var)
 * @returns CORS headers object
 */
export function getRestrictedCorsHeaders(allowedOrigin?: string): Record<string, string> {
  const origin = allowedOrigin || Deno.env.get('APP_URL') || '*';
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/**
 * Get permissive CORS headers for public functions
 * @returns CORS headers object
 */
export function getPublicCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
