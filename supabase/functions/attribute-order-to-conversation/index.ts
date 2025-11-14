import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  id: string;
  createdAt: string;
  customer?: {
    email?: string;
    id?: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        variant: {
          id: string;
          product: {
            id: string;
            title: string;
          };
        };
      };
    }>;
  };
  totalPriceSet: {
    shopMoney: {
      amount: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, order, immediate = false } = await req.json();

    if (!agentId || !order) {
      throw new Error('Missing required parameters: agentId and order');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderTime = new Date(order.createdAt);
    const lookbackWindow = new Date(orderTime.getTime() - 24 * 60 * 60 * 1000); // 24h before
    
    let bestMatch: string | null = null;
    let confidence = 0;
    const attributionMethods: string[] = [];
    let allMatchingConversations: string[] = [];

    // Extract product IDs from order
    const orderProductIds = order.lineItems?.edges?.map((edge: any) => 
      edge.node.variant.product.id.split('/').pop()
    ) || [];
    
    const orderProductTitles = order.lineItems?.edges?.map((edge: any) => 
      edge.node.title.toLowerCase()
    ) || [];

    console.log(`Attribution attempt for order ${order.id}, customer: ${order.customer?.email}`);

    // 1. EMAIL-BASED ATTRIBUTION (Primary - High Confidence)
    if (order.customer?.email) {
      const { data: leads } = await supabase
        .from('leads')
        .select('conversation_id, created_at, lead_data_json')
        .eq('agent_id', agentId)
        .gte('created_at', lookbackWindow.toISOString())
        .lte('created_at', orderTime.toISOString());

      // Filter leads with matching email
      const matchingLeads = leads?.filter(lead => {
        const email = lead.lead_data_json?.email?.toLowerCase();
        return email === order.customer.email.toLowerCase();
      }) || [];

      if (matchingLeads.length > 0) {
        // Sort by most recent
        matchingLeads.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const mostRecent = matchingLeads[0];
        const timeDiff = orderTime.getTime() - new Date(mostRecent.created_at).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        bestMatch = mostRecent.conversation_id;
        allMatchingConversations = matchingLeads.map(l => l.conversation_id);
        
        // Confidence based on time proximity
        if (hoursDiff < 1) {
          confidence = 0.95;
        } else if (hoursDiff < 6) {
          confidence = 0.85;
        } else if (hoursDiff < 12) {
          confidence = 0.75;
        } else {
          confidence = 0.70;
        }
        
        attributionMethods.push('email_match');
        console.log(`Email match found: conversation ${bestMatch}, confidence ${confidence}`);
      }
    }

    // 2. PRODUCT MENTION MATCHING (Confidence Booster)
    if (bestMatch && orderProductIds.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', bestMatch);
      
      if (messages && messages.length > 0) {
        const allText = messages.map(m => m.content).join(' ').toLowerCase();
        
        // Check how many products were mentioned
        const mentionedCount = orderProductTitles.filter(title => 
          allText.includes(title)
        ).length;
        
        if (mentionedCount > 0) {
          const mentionRatio = mentionedCount / orderProductTitles.length;
          
          // Boost confidence based on mention ratio
          if (mentionRatio >= 0.5) {
            confidence = Math.min(confidence + 0.1, 0.98);
          } else {
            confidence = Math.min(confidence + 0.05, 0.98);
          }
          
          attributionMethods.push('product_mention');
          console.log(`Products mentioned: ${mentionedCount}/${orderProductTitles.length}, confidence boosted to ${confidence}`);
        }
      }
    }

    // 3. TEMPORAL CORRELATION (Fallback - Medium Confidence)
    if (!bestMatch) {
      const { data: recentConvs } = await supabase
        .from('conversations')
        .select('id, created_at, session_id')
        .eq('agent_id', agentId)
        .gte('created_at', lookbackWindow.toISOString())
        .lte('created_at', orderTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentConvs && recentConvs.length > 0) {
        // Find conversations with messages
        const convsWithMessages = [];
        for (const conv of recentConvs) {
          const { data: messages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .limit(1);
          
          if (messages && messages.length > 0) {
            convsWithMessages.push(conv);
          }
        }
        
        if (convsWithMessages.length > 0) {
          const mostRecent = convsWithMessages[0];
          const timeDiff = orderTime.getTime() - new Date(mostRecent.created_at).getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          bestMatch = mostRecent.id;
          allMatchingConversations = convsWithMessages.map(c => c.id);
          
          // Lower confidence for temporal-only matching
          if (hoursDiff < 2) {
            confidence = 0.50;
          } else if (hoursDiff < 6) {
            confidence = 0.40;
          } else {
            confidence = 0.30;
          }
          
          attributionMethods.push('temporal_proximity');
          console.log(`Temporal match found: conversation ${bestMatch}, confidence ${confidence}`);
        }
      }
    }

    // Prepare attribution result
    const attributionResult = {
      conversation_id: bestMatch,
      confidence,
      attribution_type: attributionMethods.join('+'),
      conversation_ids: allMatchingConversations,
      matched_at: new Date().toISOString(),
    };

    // Store in agent_conversions if match found
    if (bestMatch) {
      const orderId = order.id.split('/').pop();
      const orderTotal = parseFloat(order.totalPriceSet.shopMoney.amount);
      
      const { error: conversionError } = await supabase
        .from('agent_conversions')
        .insert({
          agent_id: agentId,
          conversation_id: bestMatch,
          conversation_ids: allMatchingConversations,
          session_id: order.id, // Use order ID as session identifier
          conversion_type: 'purchase',
          order_id: orderId,
          order_total: orderTotal,
          attributed_revenue: orderTotal,
          currency: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
          products_purchased: order.lineItems?.edges?.map((e: any) => ({
            id: e.node.variant.product.id.split('/').pop(),
            title: e.node.title,
            quantity: e.node.quantity,
          })) || [],
          attribution_type: attributionResult.attribution_type,
          attribution_confidence: confidence,
        });
      
      if (conversionError) {
        console.error('Error storing conversion:', conversionError);
      } else {
        console.log(`Conversion stored for order ${orderId}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      attribution: attributionResult,
      orderAnalysis: {
        orderTime: orderTime.toISOString(),
        lookbackWindow: lookbackWindow.toISOString(),
        productsCount: orderProductIds.length,
        hasEmail: !!order.customer?.email,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attribution error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
