/**
 * Shared utilities for Shopify GraphQL API interactions
 * Ensures consistent GraphQL usage across all edge functions
 */

export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
  extensions?: any;
}

/**
 * Execute a GraphQL query/mutation against Shopify Admin API
 */
export async function shopifyGraphQL<T = any>(
  shop: string,
  token: string,
  query: string,
  variables?: Record<string, any>
): Promise<ShopifyGraphQLResponse<T>> {
  const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify GraphQL HTTP error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    console.error('Shopify GraphQL errors:', result.errors);
  }

  return result;
}

/**
 * Execute a GraphQL query with automatic retry and rate limit handling
 */
export async function shopifyGraphQLWithRetry<T = any>(
  shop: string,
  token: string,
  query: string,
  variables?: Record<string, any>,
  maxRetries: number = 3
): Promise<ShopifyGraphQLResponse<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await shopifyGraphQL<T>(shop, token, query, variables);
      
      // Log rate limit info from extensions
      if (result.extensions?.cost) {
        const cost = result.extensions.cost;
        const throttleStatus = cost.throttleStatus || cost;
        
        console.log(`Shopify API cost: ${cost.actualQueryCost || 'unknown'}/${throttleStatus.currentlyAvailable || 'unknown'} available`);
        
        // Proactive backoff if running low on quota
        if (throttleStatus.currentlyAvailable && throttleStatus.currentlyAvailable < 100) {
          const backoffMs = 1000;
          console.log(`Low API quota (${throttleStatus.currentlyAvailable}), backing off ${backoffMs}ms`);
          await delay(backoffMs);
        }
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check for rate limit error (429 or throttled message)
      const isRateLimited = 
        error.message?.includes('429') || 
        error.message?.includes('Throttled') ||
        error.message?.includes('rate limit');
      
      if (isRateLimited && attempt < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const backoffMs = Math.min(baseDelay + jitter, 30000);
        
        console.log(`Shopify rate limited, backing off ${backoffMs.toFixed(0)}ms (attempt ${attempt}/${maxRetries})`);
        await delay(backoffMs);
        continue;
      }
      
      // Non-retryable error or max retries reached
      throw error;
    }
  }
  
  throw lastError!;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Webhook topic mapping: REST format → GraphQL format
 * As of April 2025, Shopify requires GraphQL for all new apps
 */
export const WEBHOOK_TOPICS: Record<string, string> = {
  'orders/create': 'ORDERS_CREATE',
  'orders/updated': 'ORDERS_UPDATED',
  'products/create': 'PRODUCTS_CREATE',
  'products/update': 'PRODUCTS_UPDATE',
  'products/delete': 'PRODUCTS_DELETE',
  'inventory_levels/update': 'INVENTORY_LEVELS_UPDATE',
  'app/uninstalled': 'APP_UNINSTALLED',
  'app_subscriptions/update': 'APP_SUBSCRIPTIONS_UPDATE',
  'customers/data_request': 'CUSTOMERS_DATA_REQUEST',
  'customers/redact': 'CUSTOMERS_REDACT',
  'shop/redact': 'SHOP_REDACT',
};

/**
 * Register a single webhook using GraphQL
 */
export async function registerWebhook(
  shop: string,
  token: string,
  topic: string,
  callbackUrl: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const graphQLTopic = WEBHOOK_TOPICS[topic];
  
  if (!graphQLTopic) {
    return { success: false, error: `Unknown webhook topic: ${topic}` };
  }

  const mutation = `
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const result = await shopifyGraphQL(shop, token, mutation, {
      topic: graphQLTopic,
      webhookSubscription: {
        callbackUrl,
        format: 'JSON',
      },
    });

    const webhookData = result.data?.webhookSubscriptionCreate;
    
    if (webhookData?.userErrors && webhookData.userErrors.length > 0) {
      const errorMessage = webhookData.userErrors[0].message;
      
      // Check if webhook already exists
      if (errorMessage.includes('taken') || errorMessage.includes('already exists')) {
        console.log(`Webhook already exists: ${topic}`);
        return { success: true, error: 'already_exists' };
      }
      
      console.error(`Failed to register ${topic}:`, webhookData.userErrors);
      return { success: false, error: errorMessage };
    }

    const webhookId = webhookData?.webhookSubscription?.id;
    console.log(`Webhook registered successfully: ${topic} (${webhookId})`);
    
    return { success: true, id: webhookId };
  } catch (error: any) {
    console.error(`Error registering webhook ${topic}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Register multiple webhooks in batch
 */
export async function registerWebhooks(
  shop: string,
  token: string,
  webhooks: Array<{ topic: string; address: string }>
): Promise<Array<{ topic: string; status: string; id?: string; error?: string }>> {
  const results = [];

  for (const webhook of webhooks) {
    const result = await registerWebhook(shop, token, webhook.topic, webhook.address);
    
    results.push({
      topic: webhook.topic,
      status: result.success ? (result.error === 'already_exists' ? 'already_exists' : 'registered') : 'failed',
      id: result.id,
      error: result.error,
    });
  }

  return results;
}
