import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.29.2';
import { validateAuthAndAgent, getRestrictedCorsHeaders } from '../_shared/auth-helpers.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { logSecurityEvent } from '../_shared/security-logger.ts';

const corsHeaders = getRestrictedCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, linkId, crawlMode = 'scrape', crawlLimit = 10 } = await req.json();
    if (!url) throw new Error('URL is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    // Get agent_id and validate ownership
    const tempSupabase = createClient(supabaseUrl, supabaseKey);
    const { data: linkData, error: linkError } = await tempSupabase
      .from('agent_links')
      .select('agent_id')
      .eq('id', linkId)
      .single();

    if (linkError || !linkData) throw new Error('Link not found');

    const authHeader = req.headers.get('Authorization');
    const { userId } = await validateAuthAndAgent(authHeader, linkData.agent_id, supabaseUrl, supabaseKey, 'crawl-url');

    // Rate limit: 10 requests per 10 minutes
    const rateLimitResult = await checkRateLimit({
      maxRequests: 10,
      windowMinutes: 10,
      identifier: `crawl-${linkData.agent_id}`
    }, supabaseUrl, supabaseKey);

    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        event_type: 'RATE_LIMIT_EXCEEDED',
        function_name: 'crawl-url',
        agent_id: linkData.agent_id,
        user_id: userId,
        severity: 'medium'
      }, supabaseUrl, supabaseKey);

      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Firecrawl API key not configured'
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    if (crawlMode === 'scrape') {
      const scrapeResult = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
      if (!scrapeResult.success) throw new Error('Failed to scrape URL');

      const markdown = scrapeResult.markdown || '';
      const title = scrapeResult.metadata?.title || url;

      if (linkId) {
        await supabase.from('agent_links').update({
          title, content: markdown, status: 'completed',
          pages_found: 1, pages_processed: 1, updated_at: 'now()'
        }).eq('id', linkId);
      }

      return new Response(JSON.stringify({
        success: true, message: 'Successfully scraped content',
        content: markdown, title, pagesProcessed: 1
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Crawl mode not fully implemented in this version' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: error.message?.includes('authorization') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
