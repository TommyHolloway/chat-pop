import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, content, useCase } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Extracting brand info for: ${url}, use case: ${useCase}`);

    // Use Lovable AI to extract structured brand data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a brand analysis expert. Extract brand information from website content and provide structured data that will be used to configure an AI shopping assistant.`
          },
          {
            role: "user",
            content: `Analyze this website: ${url}\n\nContent (first 10k chars):\n${content.slice(0, 10000)}\n\nUse case: ${useCase}\n\nExtract the following:\n- Business name\n- Brief description (1-2 sentences)\n- Suggested AI agent instructions tailored to the use case\n- Initial greeting message for the AI agent`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_brand_info",
            description: "Extract structured brand information from website content",
            parameters: {
              type: "object",
              required: ["businessName", "businessDescription", "suggestedInstructions", "suggestedInitialMessage"],
              properties: {
                businessName: {
                  type: "string",
                  description: "The business or brand name"
                },
                businessDescription: {
                  type: "string",
                  description: "Brief 1-2 sentence business description"
                },
                suggestedInstructions: {
                  type: "string",
                  description: "Tailored AI agent instructions based on the use case and business type"
                },
                suggestedInitialMessage: {
                  type: "string",
                  description: "Friendly greeting message the AI agent should use"
                }
              },
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_brand_info" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const brandInfo = JSON.parse(toolCall.function.arguments);
    
    console.log("Successfully extracted brand info:", brandInfo);

    return new Response(JSON.stringify(brandInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error extracting brand info:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to extract brand info" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
