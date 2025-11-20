import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  config: RateLimitConfig,
  supabaseUrl: string,
  supabaseKey: string
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);
  
  const { data: requests, error } = await supabase
    .from('rate_limit_tracking')
    .select('id')
    .eq('identifier', config.identifier)
    .gte('created_at', windowStart.toISOString());
  
  if (error) {
    console.error('Rate limit check error:', error);
    throw error;
  }
  
  const currentCount = requests?.length || 0;
  const allowed = currentCount < config.maxRequests;
  
  if (allowed) {
    await supabase.from('rate_limit_tracking').insert({
      identifier: config.identifier,
      created_at: new Date().toISOString()
    });
  }
  
  const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000);
  
  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
    resetAt
  };
}
