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
    const { filePath, fileType } = await req.json();

    if (!filePath) {
      throw new Error('File path is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting content extraction for file:', filePath);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('agent-files')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    let extractedContent = '';

    if (fileType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      try {
        // For PDF files, we'll use a simple text extraction approach
        // In a production environment, you'd want to use a proper PDF parsing library
        const fileBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        
        // Simple PDF text extraction - this is a basic implementation
        // For better results, consider using a dedicated PDF parsing service
        const text = new TextDecoder().decode(uint8Array);
        
        // Basic PDF text extraction by looking for text between common PDF markers
        const textMatches = text.match(/\(([^)]+)\)/g);
        if (textMatches) {
          extractedContent = textMatches
            .map(match => match.slice(1, -1))
            .filter(text => text.length > 2 && !/^[0-9\s\.\-\/]+$/.test(text))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        if (!extractedContent || extractedContent.length < 50) {
          // Fallback: try to extract any readable text
          const cleanText = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const words = cleanText.split(' ').filter(word => 
            word.length > 2 && 
            /[a-zA-Z]/.test(word) &&
            !word.includes('obj') &&
            !word.includes('endobj')
          );
          
          if (words.length > 20) {
            extractedContent = words.slice(0, 1000).join(' ');
          }
        }

      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        extractedContent = 'PDF content extraction failed. File uploaded but content not accessible.';
      }
    } else if (fileType?.includes('text/') || filePath.toLowerCase().endsWith('.txt')) {
      // Handle text files
      extractedContent = await fileData.text();
    } else {
      // For other file types, provide a descriptive message
      extractedContent = `File uploaded: ${filePath.split('/').pop()} (${fileType || 'unknown type'}). Content extraction not supported for this file type.`;
    }

    // Ensure we have some content
    if (!extractedContent || extractedContent.trim().length === 0) {
      extractedContent = `File uploaded: ${filePath.split('/').pop()}. Content could not be extracted.`;
    }

    // Limit content size (to avoid storage issues)
    if (extractedContent.length > 50000) {
      extractedContent = extractedContent.substring(0, 50000) + '... [Content truncated]';
    }

    console.log(`Extraction completed. Content length: ${extractedContent.length} characters`);

    return new Response(JSON.stringify({
      success: true,
      extractedContent: extractedContent,
      contentLength: extractedContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-file-content function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      extractedContent: `File uploaded but content extraction failed: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});