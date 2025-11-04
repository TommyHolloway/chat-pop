import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { chromium } from 'https://deno.land/x/astral@0.4.1/mod.ts';
import TurndownService from 'https://esm.sh/turndown@7.1.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure Turndown for HTML to Markdown conversion
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Remove unwanted elements
turndown.remove(['script', 'style', 'noscript', 'iframe', 'svg']);

/**
 * Scrape a single page using Playwright
 */
async function scrapePage(url: string): Promise<{ success: boolean; title?: string; content?: string; markdown?: string; error?: string }> {
  let browser;
  
  try {
    console.log('Launching browser for URL:', url);
    
    // Launch headless Chrome
    browser = await chromium.launch({
      headless: true,
    });
    
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    console.log('Page loaded, extracting content...');
    
    // Extract title and HTML content
    const pageData = await page.evaluate(() => {
      // Get title
      const title = document.title || 'Untitled Page';
      
      // Remove unwanted elements before getting HTML
      const clonedDoc = document.cloneNode(true) as Document;
      const elementsToRemove = clonedDoc.querySelectorAll('script, style, noscript, iframe, svg, nav, footer, header[role="banner"]');
      elementsToRemove.forEach(el => el.remove());
      
      // Get main content or body
      const mainContent = clonedDoc.querySelector('main') || 
                         clonedDoc.querySelector('article') || 
                         clonedDoc.querySelector('[role="main"]') ||
                         clonedDoc.body;
      
      const html = mainContent ? mainContent.innerHTML : clonedDoc.body.innerHTML;
      
      return { title, html };
    });
    
    await browser.close();
    
    // Convert HTML to Markdown
    const markdown = turndown.turndown(pageData.html);
    
    // Clean up markdown (remove excessive whitespace)
    const cleanedMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .trim();
    
    if (!cleanedMarkdown || cleanedMarkdown.length < 50) {
      return {
        success: false,
        error: 'No content extracted from URL',
      };
    }
    
    console.log('Scrape successful:', {
      title: pageData.title,
      contentLength: cleanedMarkdown.length,
    });
    
    return {
      success: true,
      title: pageData.title,
      content: cleanedMarkdown,
      markdown: cleanedMarkdown,
    };
    
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    console.error('Scrape error:', error);
    
    let errorMessage = 'Failed to scrape the website';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Website took too long to respond. Please try again.';
      } else if (error.message.includes('net::ERR') || error.message.includes('fetch failed')) {
        errorMessage = 'Unable to reach the website. Please check the URL.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Crawl multiple pages from a website
 */
async function crawlWebsite(url: string, crawlLimit: number): Promise<{ 
  success: boolean; 
  data?: Array<{ url: string; title: string; content: string; markdown: string; metadata: any }>; 
  total?: number;
  completed?: number;
  error?: string;
}> {
  let browser;
  const crawledPages: Array<{ url: string; title: string; content: string; markdown: string; metadata: any }> = [];
  const visitedUrls = new Set<string>();
  const toVisit: string[] = [url];
  
  try {
    console.log('Starting crawl with limit:', crawlLimit);
    
    // Launch browser once for all pages
    browser = await chromium.launch({
      headless: true,
    });
    
    const baseUrl = new URL(url);
    const baseDomain = baseUrl.hostname;
    
    while (toVisit.length > 0 && crawledPages.length < crawlLimit) {
      const currentUrl = toVisit.shift()!;
      
      if (visitedUrls.has(currentUrl)) {
        continue;
      }
      
      visitedUrls.add(currentUrl);
      console.log(`Crawling page ${crawledPages.length + 1}/${crawlLimit}:`, currentUrl);
      
      try {
        const page = await browser.newPage({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        
        await page.goto(currentUrl, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        
        // Extract content and links
        const pageData = await page.evaluate(() => {
          const title = document.title || 'Untitled Page';
          
          // Get all internal links
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => {
              try {
                const linkUrl = new URL(href);
                return linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:';
              } catch {
                return false;
              }
            });
          
          // Remove unwanted elements
          const clonedDoc = document.cloneNode(true) as Document;
          const elementsToRemove = clonedDoc.querySelectorAll('script, style, noscript, iframe, svg, nav, footer, header[role="banner"]');
          elementsToRemove.forEach(el => el.remove());
          
          const mainContent = clonedDoc.querySelector('main') || 
                             clonedDoc.querySelector('article') || 
                             clonedDoc.querySelector('[role="main"]') ||
                             clonedDoc.body;
          
          const html = mainContent ? mainContent.innerHTML : clonedDoc.body.innerHTML;
          
          return { title, html, links };
        });
        
        await page.close();
        
        // Convert to markdown
        const markdown = turndown.turndown(pageData.html);
        const cleanedMarkdown = markdown
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (cleanedMarkdown && cleanedMarkdown.length >= 50) {
          crawledPages.push({
            url: currentUrl,
            title: pageData.title,
            content: cleanedMarkdown,
            markdown: cleanedMarkdown,
            metadata: {
              title: pageData.title,
              sourceURL: currentUrl,
            },
          });
        }
        
        // Add new links to visit (same domain only)
        for (const link of pageData.links) {
          try {
            const linkUrl = new URL(link);
            if (linkUrl.hostname === baseDomain && 
                !visitedUrls.has(link) && 
                !toVisit.includes(link) &&
                crawledPages.length + toVisit.length < crawlLimit) {
              toVisit.push(link);
            }
          } catch {
            // Invalid URL, skip
          }
        }
        
      } catch (error) {
        console.error(`Failed to crawl ${currentUrl}:`, error);
        // Continue with next page
      }
    }
    
    await browser.close();
    
    if (crawledPages.length === 0) {
      return {
        success: false,
        error: 'No pages could be crawled successfully',
      };
    }
    
    console.log('Crawl successful:', {
      pagesFound: visitedUrls.size + toVisit.length,
      pagesCompleted: crawledPages.length,
    });
    
    return {
      success: true,
      data: crawledPages,
      total: visitedUrls.size + toVisit.length,
      completed: crawledPages.length,
    };
    
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    console.error('Crawl error:', error);
    
    return {
      success: false,
      error: 'Failed to crawl the website. Please try again.',
    };
  }
}

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

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('Starting', crawlMode, 'for URL:', url);

    if (crawlMode === 'crawl') {
      // Use crawling mode for multiple pages
      console.log('Using crawl mode with limit:', crawlLimit);
      
      const crawlResult = await crawlWebsite(url, Math.min(crawlLimit, 100));

      if (!crawlResult.success || !crawlResult.data) {
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
          error: crawlResult.error || 'Crawl failed',
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
            url: page.url,
            title: page.title || 'Untitled Page',
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
      const combinedContent = crawlResult.data.map((page: any) => 
        page.markdown || page.content || ''
      ).join('\n\n');

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
      // Use scraping mode for single page
      console.log('Using scrape mode for single page');
      
      const scrapeResult = await scrapePage(url);

      if (!scrapeResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: scrapeResult.error || 'No content extracted from URL',
          details: 'No content was extracted from the website'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Scrape successful:', { 
        title: scrapeResult.title, 
        contentLength: scrapeResult.content?.length
      });

      return new Response(JSON.stringify({
        success: true,
        title: scrapeResult.title,
        content: scrapeResult.content,
        url,
        crawlMode: 'scrape'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
