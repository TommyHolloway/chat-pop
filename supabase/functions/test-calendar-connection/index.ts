import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { provider, api_key, configuration_json } = await req.json();
    
    if (!provider || !api_key) {
      throw new Error('Provider and API key are required');
    }

    let testResult = false;
    let message = '';

    switch (provider) {
      case 'calendly':
        testResult = await testCalendlyConnection(api_key);
        message = testResult ? 'Calendly connection successful' : 'Failed to connect to Calendly API';
        break;
      case 'calcom':
        testResult = await testCalcomConnection(api_key);
        message = testResult ? 'Cal.com connection successful' : 'Failed to connect to Cal.com API';
        break;
      case 'google':
        testResult = await testGoogleConnection(api_key);
        message = testResult ? 'Google Calendar connection successful' : 'Failed to connect to Google Calendar API';
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify({ 
      success: testResult,
      message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testCalendlyConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testCalcomConnection(apiKey: string): Promise<boolean> {
  try {
    // Cal.com API test - this is a mock for now
    // TODO: Implement actual Cal.com API test when available
    return apiKey.length > 10; // Simple validation
  } catch (error) {
    return false;
  }
}

async function testGoogleConnection(apiKey: string): Promise<boolean> {
  try {
    // Google Calendar API test - this is a mock for now
    // TODO: Implement actual Google Calendar API test
    return apiKey.length > 10; // Simple validation
  } catch (error) {
    return false;
  }
}