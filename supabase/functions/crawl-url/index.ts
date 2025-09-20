import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Firecrawl from 'https://esm.sh/@mendable/firecrawl-js@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, linkId } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    // Get Firecrawl API key from environment
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    console.log('Starting crawl for URL:', url);

    // Initialize Firecrawl
    const app = new Firecrawl({ apiKey: firecrawlApiKey });

    // Crawl the URL
    const crawlResult = await app.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (!crawlResult.success) {
      throw new Error('Failed to crawl URL');
    }

    const content = crawlResult.data?.markdown || '';
    const title = crawlResult.data?.metadata?.title || new URL(url).hostname;

    console.log('Crawl successful, extracted content length:', content.length);

    return new Response(JSON.stringify({
      success: true,
      title,
      content,
      url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in crawl-url function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});