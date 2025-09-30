import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract PDF text using pdf-parse library
async function extractPDFTextWithLibrary(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting pdf-parse library extraction');
    
    const data = await pdfParse(buffer);
    const text = data.text;
    
    console.log(`PDF extraction successful: ${text.length} characters extracted`);
    console.log(`PDF has ${data.numpages} pages`);
    
    if (!text || text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images/non-text content');
    }
    
    // Clean and normalize the extracted text
    const cleanedText = text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\r/g, '\n')             // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')       // Reduce excessive line breaks
      .replace(/[ \t]+/g, ' ')          // Normalize spaces
      .replace(/^\s+|\s+$/gm, '')       // Trim lines
      .trim();
    
    return cleanedText;
    
  } catch (error) {
    console.error('pdf-parse library extraction failed:', error);
    throw error;
  }
}

// Enhanced regex-based fallback for PDFs that can't be parsed by pdf-parse
async function extractPDFTextFallback(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Using enhanced regex fallback PDF extraction');
    
    const data = new Uint8Array(buffer);
    const textContent = new TextDecoder('latin1').decode(data);
    
    let extractedText = '';
    const foundTexts = new Set<string>();
    
    // Look for text in parentheses (PDF text objects)
    const textObjectPattern = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let match;
    while ((match = textObjectPattern.exec(textContent)) !== null) {
      if (match[1] && match[1].length > 1) {
        let text = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        if (/[a-zA-Z]/.test(text)) {
          foundTexts.add(text.trim());
        }
      }
    }
    
    // Look for simple text strings
    const simpleTextPattern = /[A-Za-z][A-Za-z0-9\s\.,!?;:()\-']{15,}/g;
    let textMatch;
    while ((textMatch = simpleTextPattern.exec(textContent)) !== null) {
      const text = textMatch[0].trim();
      if (text.length > 10 && !/^[^a-zA-Z]*$/.test(text)) {
        foundTexts.add(text);
      }
    }
    
    extractedText = Array.from(foundTexts).join(' ').trim();
    
    console.log(`Fallback extraction found ${foundTexts.size} text segments, total: ${extractedText.length} characters`);
    
    return extractedText;
      
  } catch (error) {
    console.error('Enhanced fallback PDF extraction failed:', error);
    return '';
  }
}

// Content validation function
function validateExtractedContent(content: string): { isValid: boolean; reason: string } {
  if (!content || content.length < 10) {
    return { isValid: false, reason: 'Content too short or empty' };
  }
  
  // Check for reasonable text content
  const readableChars = content.match(/[a-zA-Z0-9\s\.,!?;:()\-]/g) || [];
  const readableRatio = readableChars.length / content.length;
  
  if (readableRatio < 0.3) {
    console.log(`Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%`);
    return { isValid: false, reason: `Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%` };
  }
  
  // Check for letter content
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letterCount / content.length;
  
  if (letterRatio < 0.05) {
    console.log(`Very low letter ratio: ${(letterRatio * 100).toFixed(1)}%`);
    return { isValid: false, reason: `Content contains very few letters: ${(letterRatio * 100).toFixed(1)}%` };
  }
  
  console.log(`Content validation passed: ${(readableRatio * 100).toFixed(1)}% readable, ${(letterRatio * 100).toFixed(1)}% letters`);
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

    const fileBuffer = await fileData.arrayBuffer();
    let content = '';

    // Determine content type and extract accordingly
    const contentType = fileType || '';

    if (contentType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF file with pdf-parse library');
      
      try {
        // Try pdf-parse library first (most reliable)
        content = await extractPDFTextWithLibrary(fileBuffer);
        
        // If library extraction fails or yields minimal content, try fallback
        if (!content || content.length < 20) {
          console.log('Library extraction yielded minimal content, trying regex fallback');
          content = await extractPDFTextFallback(fileBuffer);
        }
        
        // Validate and clean content
        if (content && content.length >= 20) {
          console.log(`Successfully extracted ${content.length} characters from PDF`);
          
          // Validate content quality
          const validation = validateExtractedContent(content);
          if (!validation.isValid) {
            console.log(`Content quality warning: ${validation.reason}`);
            // If validation fails completely, try fallback
            if (validation.reason.includes('readable character ratio') && content.length > 100) {
              console.log('Trying fallback due to poor content quality');
              const fallbackContent = await extractPDFTextFallback(fileBuffer);
              if (fallbackContent && fallbackContent.length > 20) {
                content = fallbackContent;
              }
            }
          }
          
          // Final cleanup
          content = content
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable chars
            .replace(/\s{2,}/g, ' ')        // Remove extra spaces
            .trim();
            
        } else {
          content = 'Content extraction failed: PDF appears to be empty, encrypted, image-based, or uses unsupported encoding. Please try converting it to a text file first.';
        }
        
      } catch (pdfError) {
        console.error('PDF processing failed:', pdfError);
        const errorMsg = pdfError instanceof Error ? pdfError.message : 'Unknown error';
        content = `PDF processing failed: ${errorMsg}. Please try converting the PDF to a text file or check if the file is corrupted.`;
      }
      
    } else {
      // Handle text files
      console.log('Processing text file');
      try {
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(fileBuffer);
        
        if (!content.trim()) {
          content = 'File appears to be empty or contains no readable text.';
        }
        
        console.log(`Text file extracted: ${content.length} characters`);
      } catch (textError) {
        console.error('Text extraction failed:', textError);
        const errorMsg = textError instanceof Error ? textError.message : 'Unknown error';
        content = `Text extraction failed: ${errorMsg}`;
      }
    }

    // Limit content size to prevent storage issues
    const maxContentLength = 500000; // 500KB limit
    if (content.length > maxContentLength) {
      console.log(`Content truncated from ${content.length} to ${maxContentLength} characters`);
      content = content.substring(0, maxContentLength) + '\n\n[Content truncated due to size limits...]';
    }

    return new Response(JSON.stringify({
      success: true,
      content: content,
      message: `Content extracted successfully. Length: ${content.length} characters`,
      contentType: contentType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-file-content function:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMsg,
      content: `Content extraction failed: ${errorMsg}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});