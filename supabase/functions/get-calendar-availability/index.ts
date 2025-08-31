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

    // Decrypt API key using decryption service
    const { data: decryptData, error: decryptError } = await supabase.functions.invoke('decrypt-api-key', {
      body: { encrypted_key: integration.api_key_encrypted }
    });
    
    if (decryptError || !decryptData?.success) {
      throw new Error('Failed to decrypt API key');
    }
    
    const apiKey = decryptData.decrypted_key;

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
    throw new Error(`Calendly availability failed: ${error.message}`);
  }
}

async function getCalcomAvailability(apiKey: string, config: any): Promise<any[]> {
  try {
    // Cal.com API implementation - using their public API when available
    // For now implementing with mock data since Cal.com API structure varies
    
    const slots = [];
    const startDate = new Date();
    
    // Generate availability for next 7 days (9 AM - 5 PM business hours)
    for (let i = 1; i <= 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends for business scheduling
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate slots every 30 minutes during business hours
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, minute, 0, 0);
          
          slots.push({
            id: slotTime.toISOString(),
            date: slotTime.toLocaleDateString(),
            time: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            datetime: slotTime.toISOString()
          });
        }
      }
    }
    
    return slots.slice(0, 20); // Return max 20 slots to avoid overwhelming UI
  } catch (error) {
    throw new Error(`Cal.com availability failed: ${error.message}`);
  }
}

async function getGoogleCalendarAvailability(apiKey: string, config: any): Promise<any[]> {
  try {
    // Google Calendar API - fetch free/busy information
    const calendarId = config.calendarId || 'primary';
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get busy times first
    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: calendarId }]
        })
      }
    );
    
    if (!freeBusyResponse.ok) {
      throw new Error(`Google Calendar API error: ${freeBusyResponse.status}`);
    }
    
    const freeBusyData = await freeBusyResponse.json();
    const busyTimes = freeBusyData.calendars[calendarId]?.busy || [];
    
    // Generate available slots (excluding busy times)
    const slots = [];
    const startDate = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends unless configured otherwise
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate slots every 30 minutes during business hours (9 AM - 5 PM)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000);
          
          // Check if this slot conflicts with any busy time
          const isConflict = busyTimes.some((busy: any) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return (slotTime >= busyStart && slotTime < busyEnd) ||
                   (slotEnd > busyStart && slotEnd <= busyEnd);
          });
          
          if (!isConflict) {
            slots.push({
              id: slotTime.toISOString(),
              date: slotTime.toLocaleDateString(),
              time: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              datetime: slotTime.toISOString()
            });
          }
        }
      }
    }
    
    return slots.slice(0, 20); // Return max 20 slots
  } catch (error) {
    throw new Error(`Google Calendar availability failed: ${error.message}`);
  }
}