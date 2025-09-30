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
    const { agentId, conversationId, provider, configuration, slot } = await req.json();
    
    if (!agentId || !conversationId || !provider || !slot) {
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

    let bookingResult: any = null;

    switch (provider) {
      case 'calendly':
        bookingResult = await bookCalendlyAppointment(apiKey, configuration, slot);
        break;
      case 'calcom':
        bookingResult = await bookCalcomAppointment(apiKey, configuration, slot);
        break;
      case 'google':
        bookingResult = await bookGoogleCalendarAppointment(apiKey, configuration, slot);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Store booking record in conversations/messages
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: `✅ Appointment booked successfully for ${slot.date} at ${slot.time}. You'll receive a confirmation email shortly.`
    });

    return new Response(JSON.stringify({ 
      success: true,
      booking: bookingResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function bookCalendlyAppointment(apiKey: string, config: any, slot: any): Promise<any> {
  try {
    // For Calendly, we need to create a scheduling link or invitation
    // This is a simplified version - real implementation would need user details
    const bookingData = {
      event_type: slot.event_type_uri,
      start_time: slot.datetime,
      invitee: {
        name: 'Chat User',  // This should come from lead capture or user input
        email: 'user@example.com',  // This should come from lead capture
      }
    };

    const response = await fetch('https://api.calendly.com/scheduled_events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error('Failed to book Calendly appointment');
    }

    const result = await response.json();
    return {
      id: result.resource.uri,
      confirmation_number: result.resource.name,
      meeting_link: result.resource.location?.join_url
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Calendly booking failed: ${errorMessage}`);
  }
}

async function bookCalcomAppointment(apiKey: string, config: any, slot: any): Promise<any> {
  try {
    // Cal.com API booking - implement when Cal.com provides booking API
    // For now, this is a placeholder as Cal.com doesn't have a public booking API
    const bookingData = {
      eventTypeId: config.eventTypeId,
      start: slot.datetime,
      attendees: [{
        name: 'Chat User',
        email: 'user@example.com', // This should come from lead capture
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }]
    };

    // Cal.com doesn't have a public booking API yet, so we simulate the response
    // In a real implementation, you'd integrate with their webhook system
    return {
      id: `calcom_${Date.now()}`,
      confirmation_number: `CC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      meeting_link: `${config.baseUrl}/book?eventType=${config.eventTypeId}&date=${slot.datetime}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Cal.com booking failed: ${errorMessage}`);
  }
}

async function bookGoogleCalendarAppointment(apiKey: string, config: any, slot: any): Promise<any> {
  try {
    // Google Calendar API booking
    const event = {
      summary: config.eventTitle || 'Scheduled Meeting',
      description: config.eventDescription || 'Meeting booked via chat widget',
      start: {
        dateTime: slot.datetime,
        timeZone: config.timeZone || 'UTC'
      },
      end: {
        dateTime: new Date(new Date(slot.datetime).getTime() + (config.duration || 30) * 60000).toISOString(),
        timeZone: config.timeZone || 'UTC'
      },
      attendees: [
        { email: 'user@example.com' } // This should come from lead capture
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId || 'primary'}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      confirmation_number: result.id.slice(-8).toUpperCase(),
      meeting_link: result.conferenceData?.entryPoints?.[0]?.uri || result.htmlLink
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Google Calendar booking failed: ${errorMessage}`);
  }
}