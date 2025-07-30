import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Custom PDF text extraction function for Deno environment
const extractPDFText = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    // Convert ArrayBuffer to Uint8Array for processing
    const uint8Array = new Uint8Array(buffer);
    
    // Look for text streams in PDF
    const text = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
    
    // Extract text using regex patterns for PDF text objects
    const textObjects = [];
    
    // Pattern 1: Look for text between BT...ET (text object) markers
    const btMatches = text.match(/BT(.*?)ET/gs);
    if (btMatches) {
      for (const match of btMatches) {
        // Extract strings within parentheses or brackets
        const strings = match.match(/\(([^)]*)\)/g) || [];
        const bracketStrings = match.match(/\[([^\]]*)\]/g) || [];
        
        textObjects.push(...strings.map(s => s.slice(1, -1)));
        textObjects.push(...bracketStrings.map(s => s.slice(1, -1)));
      }
    }
    
    // Pattern 2: Look for Tj and TJ operators (text showing)
    const tjMatches = text.match(/\(([^)]*)\)\s*Tj/g);
    if (tjMatches) {
      textObjects.push(...tjMatches.map(match => {
        const content = match.match(/\(([^)]*)\)/);
        return content ? content[1] : '';
      }));
    }
    
    // Pattern 3: Look for stream objects containing text
    const streamMatches = text.match(/stream\s*(.*?)\s*endstream/gs);
    if (streamMatches) {
      for (const stream of streamMatches) {
        const streamText = stream.replace(/^stream\s*|\s*endstream$/g, '');
        const textInStream = streamText.match(/\(([^)]*)\)/g);
        if (textInStream) {
          textObjects.push(...textInStream.map(s => s.slice(1, -1)));
        }
      }
    }
    
    // Clean and join extracted text
    let extractedText = textObjects
      .filter(text => text && text.trim().length > 0)
      .map(text => {
        // Decode common PDF escape sequences
        return text
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
          .replace(/\\(.)/g, '$1') // Remove escape for other characters
          .trim();
      })
      .filter(text => text.length > 0)
      .join(' ');
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters except spaces
      .trim();
    
    return extractedText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw error;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content validation function to detect corrupted or binary content
function validateExtractedContent(content: string): { isValid: boolean; reason: string } {
  if (!content || content.length === 0) {
    return { isValid: false, reason: 'No content extracted' };
  }
  
  // Check for minimum length
  if (content.length < 20) {
    return { isValid: false, reason: 'Content too short (likely failed extraction)' };
  }
  
  // Check for excessive binary/control characters
  const binaryCharCount = (content.match(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g) || []).length;
  const binaryRatio = binaryCharCount / content.length;
  if (binaryRatio > 0.1) {
    return { isValid: false, reason: `High binary character ratio: ${(binaryRatio * 100).toFixed(1)}%` };
  }
  
  // Check for readable text patterns
  const readableChars = content.match(/[a-zA-Z0-9\s\.,!?;:()\-]/g) || [];
  const readableRatio = readableChars.length / content.length;
  if (readableRatio < 0.7) {
    return { isValid: false, reason: `Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%` };
  }
  
  // Check for common corrupted patterns
  const corruptedPatterns = [
    /^[A-Za-z0-9+/=]{100,}$/, // Base64-like strings
    /Skia\/PDF.*Google Docs/, // Common PDF corruption signature
    /^[^\w\s]{50,}/, // Long strings of non-word characters
    /\x00{5,}/, // Null character sequences
  ];
  
  for (const pattern of corruptedPatterns) {
    if (pattern.test(content.substring(0, 500))) {
      return { isValid: false, reason: 'Content appears corrupted (matches corruption pattern)' };
    }
  }
  
  return { isValid: true, reason: 'Content validation passed' };
}

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
        console.log('Starting PDF text extraction using improved method');
        const fileBuffer = await fileData.arrayBuffer();
        
        // Try our custom PDF text extraction first
        extractedContent = await extractPDFText(fileBuffer);
        
        // Validate content quality
        const validationResult = validateExtractedContent(extractedContent);
        console.log(`Content validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'} - ${validationResult.reason}`);
        
        // If content validation fails, try alternative extraction
        if (!validationResult.isValid) {
          console.log('Primary extraction failed, trying alternative method');
          throw new Error(`Content validation failed: ${validationResult.reason}`);
        }
        
        console.log(`PDF extraction completed. Content length: ${extractedContent.length} characters`);
        
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        
        // Enhanced fallback extraction
        try {
          console.log('Falling back to enhanced pattern-based extraction');
          const fileBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(fileBuffer);
          
          // Try different decoding methods
          let text = '';
          try {
            text = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
          } catch {
            try {
              text = new TextDecoder('latin1').decode(uint8Array);
            } catch {
              text = new TextDecoder('ascii', { fatal: false }).decode(uint8Array);
            }
          }
          
          const extractedTexts = [];
          
          // Pattern 1: Text between parentheses (most common)
          const parenthesesMatches = text.match(/\(([^)]{2,})\)/g);
          if (parenthesesMatches) {
            extractedTexts.push(...parenthesesMatches
              .map(match => match.slice(1, -1))
              .filter(text => text.length > 2 && !/^[0-9\s\.\-\/]+$/.test(text))
            );
          }
          
          // Pattern 2: Text objects with Tj operator
          const tjMatches = text.match(/\(([^)]+)\)\s*Tj/g);
          if (tjMatches) {
            extractedTexts.push(...tjMatches
              .map(match => {
                const content = match.match(/\(([^)]+)\)/);
                return content ? content[1] : '';
              })
              .filter(t => t.length > 1)
            );
          }
          
          // Pattern 3: Text in square brackets
          const bracketMatches = text.match(/\[([^\]]{3,})\]/g);
          if (bracketMatches) {
            extractedTexts.push(...bracketMatches
              .map(match => match.slice(1, -1))
              .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
            );
          }
          
          // Pattern 4: Look for readable text sequences
          const readableMatches = text.match(/[A-Za-z]{3,}[A-Za-z0-9\s\.,!?;:()\-]{10,}/g);
          if (readableMatches) {
            extractedTexts.push(...readableMatches
              .filter(text => text.length > 5)
              .map(text => text.trim())
            );
          }
          
          if (extractedTexts.length > 0) {
            extractedContent = extractedTexts
              .filter(text => text && text.trim().length > 0)
              .map(text => {
                // Clean up extracted text
                return text
                  .replace(/\\n/g, ' ')
                  .replace(/\\r/g, ' ')
                  .replace(/\\t/g, ' ')
                  .replace(/\\(.)/g, '$1')
                  .replace(/[^\x20-\x7E\s]/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              })
              .filter(text => text.length > 1)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          
          // If still no good content, provide a meaningful message
          if (!extractedContent || extractedContent.length < 50) {
            // Try to extract at least some metadata or basic info
            const titleMatch = text.match(/\/Title\s*\(([^)]+)\)/);
            const authorMatch = text.match(/\/Author\s*\(([^)]+)\)/);
            
            let basicInfo = 'PDF document processed successfully.';
            if (titleMatch) basicInfo += ` Title: ${titleMatch[1]}.`;
            if (authorMatch) basicInfo += ` Author: ${authorMatch[1]}.`;
            
            extractedContent = `${basicInfo} Content extraction partially successful - some text may not be accessible due to PDF encoding or structure.`;
          }
          
          console.log(`Fallback extraction completed. Content length: ${extractedContent.length} characters`);
          
        } catch (fallbackError) {
          console.error('All extraction methods failed:', fallbackError);
          extractedContent = 'PDF uploaded successfully. Text extraction encountered difficulties due to the document structure or encoding. The file is stored and can be referenced, but content analysis may be limited.';
        }
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