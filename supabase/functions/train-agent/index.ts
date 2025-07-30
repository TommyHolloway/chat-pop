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

    console.log(`Starting intelligent training for agent: ${agentId}`);

    // Clear existing chunks for this agent
    const { error: clearError } = await supabase
      .from('agent_knowledge_chunks')
      .delete()
      .eq('agent_id', agentId);

    if (clearError) {
      console.error('Error clearing old chunks:', clearError);
    }

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

    let totalChunks = 0;

    // Process knowledge files into chunks
    for (const file of files) {
      if (file.processed_content) {
        console.log(`Chunking file: ${file.filename}`);
        
        const { data: chunkResult, error: chunkError } = await supabase.functions.invoke('chunk-content', {
          body: {
            agentId,
            sourceId: file.id,
            sourceType: 'file',
            content: file.processed_content
          }
        });

        if (chunkError) {
          console.error(`Error chunking file ${file.filename}:`, chunkError);
        } else {
          totalChunks += chunkResult?.chunks_created || 0;
          console.log(`Chunked file ${file.filename}: ${chunkResult?.chunks_created} chunks`);
        }
      }
    }
    
    // Process agent links into chunks
    for (const link of links) {
      if (link.content) {
        console.log(`Chunking link: ${link.url}`);
        
        const { data: chunkResult, error: chunkError } = await supabase.functions.invoke('chunk-content', {
          body: {
            agentId,
            sourceId: link.id,
            sourceType: 'link',
            content: link.content
          }
        });

        if (chunkError) {
          console.error(`Error chunking link ${link.url}:`, chunkError);
        } else {
          totalChunks += chunkResult?.chunks_created || 0;
          console.log(`Chunked link ${link.url}: ${chunkResult?.chunks_created} chunks`);
        }
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

    console.log(`Agent training completed successfully with ${totalChunks} total chunks`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Agent training completed with intelligent chunking',
      totalChunks,
      linksCount: links.length,
      filesCount: files.length,
      chunkingEnabled: true
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