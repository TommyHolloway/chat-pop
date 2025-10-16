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
    const { url, linkId, crawlMode = 'scrape', crawlLimit = 10 } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Crawl request details:', { 
      url, 
      linkId, 
      crawlMode,
      crawlLimit,
      hasApiKey: !!Deno.env.get('FIRECRAWL_API_KEY') 
    });

    // Get Firecrawl API key from environment
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found in environment variables');
      throw new Error('Firecrawl API key not configured');
    }

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('Starting', crawlMode, 'for URL:', url);

    // Initialize Firecrawl
    const app = new Firecrawl({ apiKey: firecrawlApiKey });

    if (crawlMode === 'crawl') {
      // Use crawling mode for multiple pages
      console.log('Using crawl mode with limit:', crawlLimit);
      
      const crawlResult = await app.crawl(url, {
        limit: Math.min(crawlLimit, 100),
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      });

      console.log('Crawl result:', {
        status: crawlResult.status,
        completed: crawlResult.completed,
        total: crawlResult.total,
        dataLength: crawlResult.data?.length || 0
      });

      if (crawlResult.status !== 'completed') {
        // Update agent_links with failed status
        if (linkId) {
          await supabase
            .from('agent_links')
            .update({ 
              status: 'failed',
              updated_at: 'now()'
            })
            .eq('id', linkId);
        }

        const errorMsg = 'Crawl failed';
        return new Response(JSON.stringify({
          success: false,
          error: errorMsg,
          details: 'Failed to crawl the website'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update agent_links with crawl progress
      if (linkId) {
        await supabase
          .from('agent_links')
          .update({
            status: 'completed',
            pages_found: crawlResult.total || 0,
            pages_processed: crawlResult.completed || 0,
            updated_at: 'now()'
          })
          .eq('id', linkId);

        // Store individual crawled pages
        if (crawlResult.data && crawlResult.data.length > 0) {
          const crawlPages = crawlResult.data.map((page: any) => ({
            agent_link_id: linkId,
            url: page.metadata?.sourceURL || page.url || url,
            title: page.metadata?.title || 'Untitled Page',
            content: page.content || '',
            markdown: page.markdown || '',
            metadata_json: page.metadata || {},
            status: 'completed'
          }));

          await supabase
            .from('agent_crawl_pages')
            .insert(crawlPages);
        }
      }

      // Combine all page content for training
      const combinedContent = crawlResult.data?.map((page: any) => 
        page.markdown || page.content || ''
      ).join('\n\n') || '';

      console.log('Crawl successful:', { 
        pagesFound: crawlResult.total,
        pagesProcessed: crawlResult.completed,
        combinedContentLength: combinedContent.length
      });

      return new Response(JSON.stringify({
        success: true,
        title: `Crawled ${crawlResult.completed} pages from ${new URL(url).hostname}`,
        content: combinedContent,
        url,
        crawlMode,
        pagesFound: crawlResult.total,
        pagesProcessed: crawlResult.completed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Use scraping mode for single page (existing functionality)
      console.log('Using scrape mode for single page');
      
      const scrapeResult = await app.scrape(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      console.log('Scrape result:', {
        hasContent: !!(scrapeResult.markdown),
      });

      // Check for success based on actual content
      const content = scrapeResult.markdown || '';
      const title = scrapeResult.metadata?.title || new URL(url).hostname;

      // If we have no content, consider it a failure
      if (!content || content.trim() === '') {
        const errorMsg = 'No content extracted from URL';
        console.error('Scrape error:', errorMsg);
        
        return new Response(JSON.stringify({
          success: false,
          error: errorMsg,
          details: 'No content was extracted from the website'
        }), {
          status: 200, // Return 200 so client can read the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Scrape successful:', { 
        title, 
        contentLength: content.length
      });

      return new Response(JSON.stringify({
        success: true,
        title,
        content,
        url,
        crawlMode: 'scrape'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    // SECURITY: Log detailed error server-side only, return generic message to client
    console.error('Error in crawl-url function:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error details:', error.message);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'An error occurred while processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});