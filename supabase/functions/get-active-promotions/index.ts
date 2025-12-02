import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: agent } = await supabase
      .from('agents')
      .select('shopify_config')
      .eq('id', agentId)
      .single();

    if (!agent?.shopify_config?.store_domain) {
      throw new Error('Shopify not connected');
    }

    const { store_domain, admin_api_token } = agent.shopify_config;

    // Fetch active discounts using GraphQL (replaces deprecated price_rules)
    const graphqlQuery = `
      query {
        discountNodes(first: 250) {
          edges {
            node {
              id
              discount {
                ... on DiscountCodeBasic {
                  title
                  status
                  startsAt
                  endsAt
                  customerGets {
                    value {
                      ... on DiscountPercentage {
                        percentage
                      }
                      ... on DiscountAmount {
                        amount {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                  usageLimit
                }
                ... on DiscountAutomaticBasic {
                  title
                  status
                  startsAt
                  endsAt
                  customerGets {
                    value {
                      ... on DiscountPercentage {
                        percentage
                      }
                      ... on DiscountAmount {
                        amount {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${store_domain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': admin_api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery })
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    // Filter and format active promotions
    const now = new Date();
    const activePromotions = result.data.discountNodes.edges
      .map((edge: any) => edge.node.discount)
      .filter((discount: any) => {
        if (discount.status !== 'ACTIVE') return false;
        
        const startsAt = discount.startsAt ? new Date(discount.startsAt) : null;
        const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;
        
        return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
      })
      .map((discount: any) => {
        const value = discount.customerGets?.value;
        let valueDisplay = '';
        
        if (value?.percentage) {
          valueDisplay = `${value.percentage}% off`;
        } else if (value?.amount) {
          valueDisplay = `$${value.amount.amount} off`;
        }
        
        return {
          title: discount.title,
          description: `${discount.title}: ${valueDisplay}`,
          startsAt: discount.startsAt,
          endsAt: discount.endsAt,
          status: discount.status,
        };
      });

    return new Response(JSON.stringify({
      success: true,
      activePromotions: activePromotions,
      count: activePromotions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Promotions fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
