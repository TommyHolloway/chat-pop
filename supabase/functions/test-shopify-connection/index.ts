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

    console.log('Testing Shopify connection for:', storeDomain);

    // Test connection by fetching shop info
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', response.status, errorText);
      
      return new Response(JSON.stringify({
        success: false,
        error: response.status === 401 ? 'Invalid API token' : `API error: ${response.status}`,
        scopes: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    
    // Extract API scopes from response headers
    const scopesHeader = response.headers.get('X-Shopify-Access-Scopes');
    const scopes = scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];
    
    console.log('Connection successful:', data.shop?.name);

    // Check if all required scopes are present in the header
    const requiredScopes = ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'read_price_rules'];
    const missingScopesFromHeader = requiredScopes.filter(scope => !scopes.includes(scope));

    if (missingScopesFromHeader.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Missing required scopes: ${missingScopesFromHeader.join(', ')}. Please update your Shopify app permissions.`,
        missingScopes: missingScopesFromHeader,
        grantedScopes: scopes
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify endpoint access for testable scopes (read_inventory verified via header since inventory endpoints require specific query params)
    const scopeTests = [
      { name: 'read_products', url: `https://${storeDomain}/admin/api/2024-10/products.json?limit=1` },
      { name: 'read_orders', url: `https://${storeDomain}/admin/api/2024-10/orders.json?limit=1` },
      { name: 'read_customers', url: `https://${storeDomain}/admin/api/2024-10/customers.json?limit=1` },
      { name: 'read_price_rules', url: `https://${storeDomain}/admin/api/2024-10/price_rules.json?limit=1` }
    ];

    const missingScopes: string[] = [];

    for (const test of scopeTests) {
      const testResponse = await fetch(test.url, {
        headers: {
          'X-Shopify-Access-Token': adminApiToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!testResponse.ok) {
        console.log(`Failed scope test for ${test.name}:`, testResponse.status);
        missingScopes.push(test.name);
      }
    }

    // If any scopes are missing, return error
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

    console.log('All scope tests passed successfully');

    return new Response(JSON.stringify({
      success: true,
      shopName: data.shop?.name,
      shopDomain: data.shop?.domain,
      email: data.shop?.email,
      currency: data.shop?.currency,
      scopes: scopes,
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
