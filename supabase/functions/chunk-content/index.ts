import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple token estimation (roughly 4 characters per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Chunk content intelligently
function chunkContent(content: string, maxTokens: number = 800): Array<{text: string, index: number, metadata: any}> {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  const overlap = 100; // Character overlap between chunks
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = estimateTokens(line);
    
    // If adding this line would exceed max tokens, save current chunk
    if (currentTokens + lineTokens > maxTokens && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        metadata: {
          start_line: Math.max(0, i - currentChunk.split('\n').length),
          end_line: i - 1,
          token_count: currentTokens
        }
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n' + line;
      currentTokens = estimateTokens(currentChunk);
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
      currentTokens += lineTokens;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      metadata: {
        start_line: Math.max(0, lines.length - currentChunk.split('\n').length),
        end_line: lines.length - 1,
        token_count: currentTokens
      }
    });
  }
  
  return chunks;
}

// Extract metadata from markdown content
function extractMetadata(content: string): any {
  const metadata: any = {};
  const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
  
  metadata.headings = headings.map(h => {
    const level = h.match(/^#+/)?.[0].length || 0;
    const text = h.replace(/^#+\s*/, '');
    return { level, text };
  });
  
  metadata.has_code = /```/.test(content);
  metadata.has_lists = /^\s*[\-\*\+]\s+/m.test(content);
  metadata.word_count = content.split(/\s+/).length;
  
  return metadata;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, sourceId, sourceType, content } = await req.json();

    if (!agentId || !sourceId || !sourceType || !content) {
      throw new Error('Agent ID, source ID, source type, and content are required');
    }

    console.log(`Chunking content for agent ${agentId}, source: ${sourceType}/${sourceId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear existing chunks for this source
    await supabase
      .from('agent_knowledge_chunks')
      .delete()
      .eq('agent_id', agentId)
      .eq('source_id', sourceId)
      .eq('source_type', sourceType);

    // Extract metadata from the content
    const globalMetadata = extractMetadata(content);
    
    // Chunk the content
    const chunks = chunkContent(content);
    
    console.log(`Created ${chunks.length} chunks`);

    // Insert chunks into database
    const chunkInserts = chunks.map(chunk => ({
      agent_id: agentId,
      source_id: sourceId,
      source_type: sourceType,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      metadata_json: {
        ...globalMetadata,
        ...chunk.metadata
      },
      token_count: estimateTokens(chunk.text)
    }));

    const { error: insertError } = await supabase
      .from('agent_knowledge_chunks')
      .insert(chunkInserts);

    if (insertError) {
      console.error('Error inserting chunks:', insertError);
      throw new Error(`Failed to insert chunks: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${chunks.length} chunks for agent ${agentId}, source: ${sourceType}/${sourceId}`);

    return new Response(JSON.stringify({
      success: true,
      chunks_created: chunks.length,
      total_tokens: chunks.reduce((sum, chunk) => sum + estimateTokens(chunk.text), 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chunk-content function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});