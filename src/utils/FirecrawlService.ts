/**
 * SECURITY: Firecrawl API key is now stored server-side in Supabase secrets.
 * All crawling operations go through the secure edge function at /crawl-url
 * which prevents API key exposure to the client.
 */

import { supabase } from '@/integrations/supabase/client';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlResponse {
  success: true;
  data: any;
}

type FirecrawlResult = CrawlResponse | ErrorResponse;

export class FirecrawlService {
  /**
   * Crawl a URL using the secure server-side edge function
   * @param url - The URL to crawl
   * @param linkId - Optional agent link ID for database updates
   * @param crawlMode - 'scrape' for single page or 'crawl' for multiple pages
   * @param crawlLimit - Maximum number of pages to crawl
   */
  static async crawlUrl(
    url: string, 
    linkId?: string, 
    crawlMode: 'scrape' | 'crawl' = 'scrape',
    crawlLimit: number = 10
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Calling secure crawl-url edge function');
      
      // Call Supabase edge function (API key is server-side)
      const { data, error } = await supabase.functions.invoke('crawl-url', {
        body: { 
          url, 
          linkId, 
          crawlMode, 
          crawlLimit 
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to crawl URL' 
        };
      }

      if (!data?.success) {
        return { 
          success: false, 
          error: data?.error || 'Failed to crawl URL' 
        };
      }

      console.log('Crawl successful');
      return { 
        success: true,
        data: data.data 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to crawl service' 
      };
    }
  }
}