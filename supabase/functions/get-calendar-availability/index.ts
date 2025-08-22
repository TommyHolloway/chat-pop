import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { agentId, provider, configuration } = await req.json();
    
    if (!agentId || !provider || !configuration) {
      throw new Error('Missing required parameters');
    }

    console.log(`Fetching availability for ${provider} agent ${agentId}`);

    // Get calendar integration from database  
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('api_key_encrypted, configuration_json')
      .eq('agent_id', agentId)
      .eq('provider', provider)
      .eq('integration_mode', 'embedded')
      .eq('is_active', true)
      .single();

    if (!integration?.api_key_encrypted) {
      throw new Error('No encrypted API key found for this integration');
    }

    // Decrypt API key (placeholder - implement decryption)
    const apiKey = integration.api_key_encrypted; // TODO: Decrypt this

    let slots: any[] = [];

    switch (provider) {
      case 'calendly':
        slots = await getCalendlyAvailability(apiKey, configuration);
        break;
      case 'calcom':
        slots = await getCalcomAvailability(apiKey, configuration);
        break;
      case 'google':
        slots = await getGoogleCalendarAvailability(apiKey, configuration);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      slots 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getCalendlyAvailability(apiKey: string, config: any): Promise<any[]> {
  try {
    // Get user info first
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Calendly user info');
    }

    const userData = await userResponse.json();
    const userUri = userData.resource.uri;

    // Get event types
    const eventTypesResponse = await fetch(`https://api.calendly.com/event_types?user=${userUri}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!eventTypesResponse.ok) {
      throw new Error('Failed to fetch Calendly event types');
    }

    const eventTypesData = await eventTypesResponse.json();
    const eventType = eventTypesData.collection[0]?.uri;

    if (!eventType) {
      return [];
    }

    // Get availability for next 7 days
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const availabilityResponse = await fetch(`https://api.calendly.com/event_type_available_times?event_type=${eventType}&start_time=${startTime}&end_time=${endTime}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!availabilityResponse.ok) {
      throw new Error('Failed to fetch Calendly availability');
    }

    const availabilityData = await availabilityResponse.json();
    
    return availabilityData.collection.map((slot: any) => ({
      id: slot.start_time,
      date: new Date(slot.start_time).toLocaleDateString(),
      time: new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      datetime: slot.start_time,
      event_type_uri: eventType
    }));

  } catch (error) {
    console.error('Calendly API error:', error);
    return [];
  }
}

async function getCalcomAvailability(apiKey: string, config: any): Promise<any[]> {
  // Cal.com API implementation
  try {
    // Mock implementation for now
    const slots = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Add some sample slots
      const morningSlot = new Date(date);
      morningSlot.setHours(10, 0, 0, 0);
      
      const afternoonSlot = new Date(date);
      afternoonSlot.setHours(14, 0, 0, 0);
      
      slots.push({
        id: morningSlot.toISOString(),
        date: morningSlot.toLocaleDateString(),
        time: morningSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        datetime: morningSlot.toISOString()
      });
      
      slots.push({
        id: afternoonSlot.toISOString(),
        date: afternoonSlot.toLocaleDateString(),
        time: afternoonSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        datetime: afternoonSlot.toISOString()
      });
    }
    
    return slots;
  } catch (error) {
    console.error('Cal.com API error:', error);
    return [];
  }
}

async function getGoogleCalendarAvailability(apiKey: string, config: any): Promise<any[]> {
  // Google Calendar API implementation
  try {
    // Mock implementation for now
    const slots = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Add some sample slots
      const slot1 = new Date(date);
      slot1.setHours(9, 0, 0, 0);
      
      const slot2 = new Date(date);
      slot2.setHours(13, 30, 0, 0);
      
      const slot3 = new Date(date);
      slot3.setHours(16, 0, 0, 0);
      
      slots.push(
        {
          id: slot1.toISOString(),
          date: slot1.toLocaleDateString(),
          time: slot1.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          datetime: slot1.toISOString()
        },
        {
          id: slot2.toISOString(),
          date: slot2.toLocaleDateString(),
          time: slot2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          datetime: slot2.toISOString()
        },
        {
          id: slot3.toISOString(),
          date: slot3.toLocaleDateString(),
          time: slot3.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          datetime: slot3.toISOString()
        }
      );
    }
    
    return slots;
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return [];
  }
}