import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.29.2';

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
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Firecrawl API key not configured. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    console.log('Starting', crawlMode, 'for URL:', url);

    if (crawlMode === 'crawl') {
      // Use crawling mode for multiple pages
      console.log('Using Firecrawl crawl mode with limit:', crawlLimit);
      
      try {
        const crawlResult = await firecrawl.crawlUrl(url, {
          limit: Math.min(crawlLimit, 100),
          scrapeOptions: {
            formats: ['markdown'],
          }
        });

        if (!crawlResult.success) {
          console.error('Firecrawl crawl failed:', crawlResult.error);
          
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

          return new Response(JSON.stringify({
            success: false,
            error: crawlResult.error || 'Failed to crawl website',
            details: 'Firecrawl API returned an error'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const pages = crawlResult.data || [];
        const completedPages = pages.length;
        const totalPages = pages.length;

        console.log('Firecrawl crawl successful:', {
          pagesCompleted: completedPages,
          totalPages: totalPages
        });

        // Update agent_links with crawl progress
        if (linkId) {
          await supabase
            .from('agent_links')
            .update({
              status: 'completed',
              pages_found: totalPages,
              pages_processed: completedPages,
              updated_at: 'now()'
            })
            .eq('id', linkId);

          // Store individual crawled pages
          if (pages.length > 0) {
            const crawlPages = pages.map((page: any) => ({
              agent_link_id: linkId,
              url: page.url || page.metadata?.url || url,
              title: page.metadata?.title || page.title || 'Untitled Page',
              content: page.markdown || page.content || '',
              markdown: page.markdown || page.content || '',
              metadata_json: page.metadata || {},
              status: 'completed'
            }));

            await supabase
              .from('agent_crawl_pages')
              .insert(crawlPages);
          }
        }

        // Combine all page content for training
        const combinedContent = pages.map((page: any) => 
          page.markdown || page.content || ''
        ).join('\n\n');

        return new Response(JSON.stringify({
          success: true,
          title: `Crawled ${completedPages} pages from ${new URL(url).hostname}`,
          content: combinedContent,
          url,
          crawlMode,
          pagesFound: totalPages,
          pagesProcessed: completedPages
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Firecrawl crawl error:', error);
        
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

        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to crawl website',
          details: 'Error during Firecrawl API call'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } else {
      // Use scraping mode for single page
      console.log('Using Firecrawl scrape mode for single page');
      
      try {
        const scrapeResult = await firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
        });

        if (!scrapeResult.success) {
          console.error('Firecrawl scrape failed:', scrapeResult.error);
          return new Response(JSON.stringify({
            success: false,
            error: scrapeResult.error || 'Failed to scrape website',
            details: 'Firecrawl API returned an error'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const title = scrapeResult.metadata?.title || scrapeResult.title || 'Untitled Page';
        const markdown = scrapeResult.markdown || scrapeResult.content || '';

        if (!markdown || markdown.length < 50) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No content extracted from URL',
            details: 'The page appears to be empty or inaccessible'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Firecrawl scrape successful:', { 
          title, 
          contentLength: markdown.length
        });

        return new Response(JSON.stringify({
          success: true,
          title,
          content: markdown,
          url,
          crawlMode: 'scrape'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Firecrawl scrape error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to scrape website',
          details: 'Error during Firecrawl API call'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

  } catch (error) {
    console.error('Error in crawl-url function:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error details:', error.message);
    }
    
    let errorMessage = 'An error occurred while processing your request. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        errorMessage = 'Unable to reach the website. Please check the URL and try again.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Configuration issue. Please contact support.';
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
