import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeDomain, adminApiToken } = await req.json();

    if (!storeDomain || !adminApiToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Store domain and API token are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Testing Shopify GraphQL connection for:', storeDomain);

    // Single GraphQL query to test connection and fetch shop info
    const graphqlQuery = `
      query {
        shop {
          name
          myshopifyDomain
          email
          currencyCode
        }
      }
    `;

    const response = await fetch(`https://${storeDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: graphqlQuery })
    });

    if (!response.ok) {
      console.error('Shopify GraphQL API error:', response.status);
      return new Response(JSON.stringify({
        success: false,
        error: response.status === 401 ? 'Invalid API token' : `API error: ${response.status}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();

    // GraphQL returns errors in the response, not as HTTP status codes
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      
      // Check if errors indicate missing scopes
      const scopeErrors = result.errors.filter((e: any) => 
        e.message.toLowerCase().includes('access') || 
        e.message.toLowerCase().includes('permission')
      );
      
      if (scopeErrors.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required API scopes. Please ensure your Shopify app has: read_products, read_orders, read_customers, read_inventory, and read_discounts enabled.',
          missingScopes: ['Check Shopify app permissions']
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: result.errors[0].message || 'GraphQL query failed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const shopData = result.data?.shop;

    if (!shopData) {
      throw new Error('No shop data returned from GraphQL query');
    }

    console.log('Connection successful:', shopData.name);

    // Test each required scope with minimal GraphQL queries
    const scopeTests = [
      {
        name: 'read_products',
        query: `{ products(first: 1) { edges { node { id } } } }`
      },
      {
        name: 'read_orders',
        query: `{ orders(first: 1) { edges { node { id } } } }`
      },
      {
        name: 'read_customers',
        query: `{ customers(first: 1) { edges { node { id } } } }`
      },
      {
        name: 'read_inventory',
        query: `{ inventoryItems(first: 1) { edges { node { id } } } }`
      },
      {
        name: 'read_discounts',
        query: `{ discountNodes(first: 1) { edges { node { id } } } }`
      }
    ];

    const missingScopes: string[] = [];

    for (const test of scopeTests) {
      const testResponse = await fetch(`https://${storeDomain}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': adminApiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: test.query })
      });

      if (testResponse.ok) {
        const testResult = await testResponse.json();
        if (testResult.errors) {
          const hasPermissionError = testResult.errors.some((e: any) =>
            e.message.toLowerCase().includes('access') ||
            e.message.toLowerCase().includes('permission')
          );
          if (hasPermissionError) {
            console.log(`Missing scope: ${test.name}`);
            missingScopes.push(test.name);
          }
        }
      }
    }

    if (missingScopes.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Missing required scopes: ${missingScopes.join(', ')}. Please update your Shopify app permissions.`,
        missingScopes: missingScopes
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('All GraphQL scope tests passed');

    return new Response(JSON.stringify({
      success: true,
      shopName: shopData.name,
      shopDomain: shopData.myshopifyDomain,
      email: shopData.email,
      currency: shopData.currencyCode,
      apiVersion: 'GraphQL 2025-01',
      message: 'Connection successful'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error testing Shopify connection:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to connect to Shopify'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
