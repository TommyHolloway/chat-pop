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
      // Use crawling mode for multiple pages with real-time updates
      console.log('Using Firecrawl async crawl mode with limit:', crawlLimit);
      
      try {
        // Start async crawl
        const crawlJob = await firecrawl.asyncCrawlUrl(url, {
          limit: Math.min(crawlLimit, 100),
          scrapeOptions: {
            formats: ['markdown'],
          }
        });

        if (!crawlJob.success) {
          console.error('Failed to start crawl job:', crawlJob.error);
          
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
            error: crawlJob.error || 'Failed to start crawl',
            details: 'Firecrawl API returned an error'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Crawl job started with ID:', crawlJob.id);

        // Poll for crawl results with real-time updates
        let pagesDiscovered = 0;
        const insertedUrls = new Set<string>(); // Track unique inserted URLs
        let allContent: string[] = [];
        let isComplete = false;
        const maxAttempts = 60; // Poll for up to 2 minutes
        let attempts = 0;
        
        // Helper function to normalize URLs
        const normalizeUrl = (url: string) => {
          try {
            const urlObj = new URL(url);
            // Remove trailing slash and convert to lowercase
            return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '').toLowerCase();
          } catch {
            return url.toLowerCase().replace(/\/$/, '');
          }
        };

        while (!isComplete && attempts < maxAttempts) {
          attempts++;
          
          try {
            const status = await firecrawl.checkCrawlStatus(crawlJob.id);
            
            if (status.status === 'completed') {
              console.log('Crawl completed:', status);
              isComplete = true;
              
              const pages = status.data || [];
              
              // Insert any remaining pages (avoid duplicates)
              for (const page of pages) {
                if (linkId) {
                  const pageUrl = page.url || page.metadata?.url || url;
                  const normalizedUrl = normalizeUrl(pageUrl);
                  
                  // Only insert if not already inserted
                  if (!insertedUrls.has(normalizedUrl)) {
                    const pageContent = page.markdown || page.content || '';
                    allContent.push(pageContent);
                    
                    const { error } = await supabase
                      .from('agent_crawl_pages')
                      .insert({
                        agent_link_id: linkId,
                        url: pageUrl,
                        title: page.metadata?.title || page.title || 'Untitled Page',
                        content: pageContent,
                        markdown: pageContent,
                        metadata_json: page.metadata || {},
                        status: 'completed'
                      });
                    
                    if (!error) {
                      insertedUrls.add(normalizedUrl);
                    }
                  }
                }
              }
              
              pagesDiscovered = Math.max(pagesDiscovered, pages.length, insertedUrls.size);
              
              // Update final status with accurate counts
              if (linkId) {
                await supabase
                  .from('agent_links')
                  .update({
                    status: 'completed',
                    pages_found: insertedUrls.size,
                    pages_processed: insertedUrls.size,
                    updated_at: 'now()'
                  })
                  .eq('id', linkId);
              }
              
            } else if (status.status === 'failed') {
              console.error('Crawl failed:', status);
              isComplete = true;
              
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
                error: 'Crawl job failed',
                details: status.error || 'Unknown error'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
              
            } else if (status.status === 'scraping') {
              // Update progress with partial results (avoid duplicates)
              const partialPages = status.data || [];
              
              for (const page of partialPages) {
                const pageUrl = page.url || page.metadata?.url || url;
                const normalizedUrl = normalizeUrl(pageUrl);
                
                // Only insert if not already inserted
                if (!insertedUrls.has(normalizedUrl)) {
                  const pageContent = page.markdown || page.content || '';
                  allContent.push(pageContent);
                  
                  const { error } = await supabase
                    .from('agent_crawl_pages')
                    .insert({
                      agent_link_id: linkId,
                      url: pageUrl,
                      title: page.metadata?.title || page.title || 'Untitled Page',
                      content: pageContent,
                      markdown: pageContent,
                      metadata_json: page.metadata || {},
                      status: 'completed'
                    });
                  
                  if (!error) {
                    insertedUrls.add(normalizedUrl);
                  }
                }
              }
              
              // Update discovered count based on status total or current unique pages
              pagesDiscovered = Math.max(pagesDiscovered, status.total || partialPages.length, insertedUrls.size);
              
              // Update progress with accurate counts
              if (linkId) {
                await supabase
                  .from('agent_links')
                  .update({
                    status: 'processing',
                    pages_found: pagesDiscovered,
                    pages_processed: insertedUrls.size,
                    updated_at: 'now()'
                  })
                  .eq('id', linkId);
              }
              
              console.log(`Crawl in progress: ${insertedUrls.size}/${pagesDiscovered} pages processed`);
            }
            
            // Wait before next poll (2 seconds)
            if (!isComplete) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (statusError) {
            console.error('Error checking crawl status:', statusError);
            // Continue polling despite errors
          }
        }

        // Combine all page content
        const combinedContent = allContent.join('\n\n');

        return new Response(JSON.stringify({
          success: true,
          title: `Crawled ${insertedUrls.size} pages from ${new URL(url).hostname}`,
          content: combinedContent,
          url,
          crawlMode,
          pagesFound: insertedUrls.size,
          pagesProcessed: insertedUrls.size
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Firecrawl crawl error:', error);
        
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
