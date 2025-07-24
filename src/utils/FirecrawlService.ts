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
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async crawlUrl(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Use edge function instead of direct API call for security
      const response = await fetch('/api/crawl-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Failed to crawl URL' 
        };
      }

      return { 
        success: true,
        data: result 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to crawl API' 
      };
    }
  }
}