import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';
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
 * Scrape a single page using fetch + DOMParser
 */
async function scrapePage(url: string): Promise<{ success: boolean; title?: string; content?: string; markdown?: string; error?: string }> {
  try {
    console.log('Fetching URL:', url);
    
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `Website returned status ${response.status}`,
      };
    }
    
    const html = await response.text();
    
    console.log('Parsing HTML...');
    
    // Parse HTML with DOMParser
    const document = new DOMParser().parseFromString(html, 'text/html');
    
    if (!document) {
      return {
        success: false,
        error: 'Failed to parse HTML',
      };
    }
    
    // Extract title
    const title = document.querySelector('title')?.textContent || 'Untitled Page';
    
    // Remove unwanted elements
    const elementsToRemove = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer', 'header[role="banner"]'];
    elementsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Get main content or body
    const mainContent = document.querySelector('main') || 
                       document.querySelector('article') || 
                       document.querySelector('[role="main"]') ||
                       document.body;
    
    if (!mainContent) {
      return {
        success: false,
        error: 'No content found on page',
      };
    }
    
    const contentHtml = mainContent.innerHTML;
    
    // Convert HTML to Markdown
    const markdown = turndown.turndown(contentHtml);
    
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
      title,
      contentLength: cleanedMarkdown.length,
    });
    
    return {
      success: true,
      title,
      content: cleanedMarkdown,
      markdown: cleanedMarkdown,
    };
    
  } catch (error) {
    console.error('Scrape error:', error);
    
    let errorMessage = 'Failed to scrape the website';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Website took too long to respond. Please try again.';
      } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
        errorMessage = 'Unable to reach the website. Please check the URL.';
      } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
        errorMessage = 'SSL certificate issue with the website.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract all internal links from a document
 */
function extractLinks(document: any, baseUrl: string): string[] {
  try {
    const baseDomain = new URL(baseUrl).hostname;
    const links: string[] = [];
    
    const anchorElements = document.querySelectorAll('a[href]');
    
    for (const anchor of anchorElements) {
      try {
        const href = (anchor as Element).getAttribute('href');
        if (!href) continue;
        
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, baseUrl).href;
        const urlObj = new URL(absoluteUrl);
        
        // Only include http(s) links from same domain
        if ((urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
            urlObj.hostname === baseDomain &&
            !links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }
    
    return links;
  } catch (error) {
    console.error('Error extracting links:', error);
    return [];
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
  const crawledPages: Array<{ url: string; title: string; content: string; markdown: string; metadata: any }> = [];
  const visitedUrls = new Set<string>();
  const toVisit: string[] = [url];
  
  try {
    console.log('Starting crawl with limit:', crawlLimit);
    
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
        // Fetch the HTML content
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(30000),
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${currentUrl}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        const document = new DOMParser().parseFromString(html, 'text/html');
        
        if (!document) {
          console.error(`Failed to parse ${currentUrl}`);
          continue;
        }
        
        // Extract title
        const title = document.querySelector('title')?.textContent || 'Untitled Page';
        
        // Extract links before removing elements
        const links = extractLinks(document, currentUrl);
        
        // Remove unwanted elements
        const elementsToRemove = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer', 'header[role="banner"]'];
        elementsToRemove.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });
        
        // Get main content
        const mainContent = document.querySelector('main') || 
                           document.querySelector('article') || 
                           document.querySelector('[role="main"]') ||
                           document.body;
        
        if (mainContent) {
          const contentHtml = mainContent.innerHTML;
          const markdown = turndown.turndown(contentHtml);
          const cleanedMarkdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          
          if (cleanedMarkdown && cleanedMarkdown.length >= 50) {
            crawledPages.push({
              url: currentUrl,
              title,
              content: cleanedMarkdown,
              markdown: cleanedMarkdown,
              metadata: {
                title,
                sourceURL: currentUrl,
              },
            });
          }
        }
        
        // Add new links to visit (same domain only)
        for (const link of links) {
          if (!visitedUrls.has(link) && 
              !toVisit.includes(link) &&
              crawledPages.length + toVisit.length < crawlLimit) {
            toVisit.push(link);
          }
        }
        
      } catch (error) {
        console.error(`Failed to crawl ${currentUrl}:`, error);
        // Continue with next page
      }
    }
    
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
