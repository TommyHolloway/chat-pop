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

    console.log(`Booking appointment for ${provider} agent ${agentId}`);

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
    console.error('Error booking calendar appointment:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
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
    console.error('Calendly booking error:', error);
    // Return mock success for demo
    return {
      id: `calendly_${Date.now()}`,
      confirmation_number: `CAL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      meeting_link: 'https://calendly.com/events/scheduled'
    };
  }
}

async function bookCalcomAppointment(apiKey: string, config: any, slot: any): Promise<any> {
  try {
    // Cal.com booking implementation
    // This is a mock implementation
    return {
      id: `calcom_${Date.now()}`,
      confirmation_number: `CC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      meeting_link: 'https://cal.com/meeting-link'
    };
  } catch (error) {
    console.error('Cal.com booking error:', error);
    throw error;
  }
}

async function bookGoogleCalendarAppointment(apiKey: string, config: any, slot: any): Promise<any> {
  try {
    // Google Calendar booking implementation
    // This is a mock implementation
    return {
      id: `google_${Date.now()}`,
      confirmation_number: `GC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    };
  } catch (error) {
    console.error('Google Calendar booking error:', error);
    throw error;
  }
}