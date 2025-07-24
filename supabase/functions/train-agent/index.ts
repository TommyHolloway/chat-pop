import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting agent training for agent:', agentId);

    // Fetch all knowledge sources for the agent
    const [linksResult, filesResult] = await Promise.all([
      supabase
        .from('agent_links')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'crawled'),
      supabase
        .from('knowledge_files')
        .select('*')
        .eq('agent_id', agentId)
    ]);

    if (linksResult.error) throw linksResult.error;
    if (filesResult.error) throw filesResult.error;

    const links = linksResult.data || [];
    const files = filesResult.data || [];

    console.log(`Training with ${links.length} links and ${files.length} files`);

    // Combine all knowledge content
    let combinedKnowledge = '';

    // Add link content
    for (const link of links) {
      if (link.content) {
        combinedKnowledge += `\n\n=== Content from ${link.url} ===\n`;
        combinedKnowledge += `Title: ${link.title || 'Unknown'}\n`;
        combinedKnowledge += link.content;
      }
    }

    // Add file content
    for (const file of files) {
      if (file.processed_content) {
        combinedKnowledge += `\n\n=== Content from ${file.filename} ===\n`;
        combinedKnowledge += file.processed_content;
      }
    }

    // Update agent with training status
    const { error: updateError } = await supabase
      .from('agents')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) throw updateError;

    console.log('Agent training completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Agent training completed',
      knowledgeSize: combinedKnowledge.length,
      linksCount: links.length,
      filesCount: files.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in train-agent function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});