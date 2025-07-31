import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced PDF text extraction using multiple strategies
async function extractPDFTextWithPatterns(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting pattern-based PDF text extraction');
    
    const data = new Uint8Array(buffer);
    const textContent = new TextDecoder('latin1').decode(data);
    
    console.log(`Processing PDF buffer of ${data.length} bytes`);
    
    let extractedText = '';
    const foundTexts = new Set<string>(); // Prevent duplicates
    
    // Strategy 1: Extract text from text objects (Tj and TJ operators)
    const textObjectPatterns = [
      // Single text strings
      /\(([^)\\]+(?:\\.[^)\\]*)*)\)\s*Tj/g,
      // Text arrays
      /\[([^\]]+)\]\s*TJ/g,
      // BT...ET blocks (text objects)
      /BT\s+.*?\((.*?)\).*?ET/gs,
      // Alternative text patterns
      /\/F\d+\s+\d+\s+Tf\s*\((.*?)\)/g
    ];
    
    for (const pattern of textObjectPatterns) {
      let match;
      while ((match = pattern.exec(textContent)) !== null) {
        if (match[1]) {
          let text = match[1];
          
          // Clean up text arrays (TJ operator format)
          if (text.includes('[') || text.includes(']')) {
            text = text.replace(/[\[\]]/g, '').replace(/\)\s*\d*\s*\(/g, ' ');
          }
          
          // Clean escape sequences
          text = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
          
          // Filter out very short or non-meaningful text
          if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
            foundTexts.add(text.trim());
          }
        }
      }
    }
    
    // Strategy 2: Look for stream objects that might contain text
    const streamPattern = /stream\s*(.*?)\s*endstream/gs;
    let streamMatch;
    while ((streamMatch = streamPattern.exec(textContent)) !== null) {
      const streamData = streamMatch[1];
      
      // Try to extract readable text from streams
      const readableText = streamData.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (readableText.length > 10 && /[a-zA-Z]{3,}/.test(readableText)) {
        foundTexts.add(readableText);
      }
    }
    
    // Strategy 3: Look for direct readable text in the PDF
    const readableTextPattern = /[a-zA-Z][a-zA-Z0-9\s\.,!?;:()\-'"{}\[\]]{10,}/g;
    let readableMatch;
    while ((readableMatch = readableTextPattern.exec(textContent)) !== null) {
      const text = readableMatch[0].trim();
      if (text.length > 15) {
        foundTexts.add(text);
      }
    }
    
    // Combine and clean all found texts
    extractedText = Array.from(foundTexts).join('\n').trim();
    
    console.log(`Pattern extraction found ${foundTexts.size} text segments, total length: ${extractedText.length}`);
    
    return extractedText;
    
  } catch (error) {
    console.error('Pattern-based PDF extraction failed:', error);
    throw error;
  }
}

// Fallback PDF text extraction for when pdf.js fails
async function extractPDFTextFallback(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Using fallback PDF extraction method');
    
    const data = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(data);
    
    // Look for text patterns in the PDF
    const textPatterns = [
      /\(([^)]+)\)\s*Tj/g,
      /\[([^\]]+)\]\s*TJ/g,
      /BT\s+([^E]+?)\s+ET/g
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          extractedText += match[1].replace(/\\[nrt]/g, ' ') + ' ';
        }
      }
    }
    
    // Clean and return
    return extractedText
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
  } catch (error) {
    console.error('Fallback PDF extraction failed:', error);
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
      console.log('Processing PDF file with pattern-based extraction');
      
      try {
        // Use pattern-based extraction (no external dependencies)
        content = await extractPDFTextWithPatterns(fileBuffer);
        
        // If pattern extraction fails or yields minimal content, try fallback
        if (!content || content.length < 20) {
          console.log('Pattern extraction yielded minimal content, trying enhanced fallback');
          content = await extractPDFTextFallback(fileBuffer);
        }
        
        // Validate and clean content
        if (content && content.length >= 20) {
          console.log(`Successfully extracted ${content.length} characters from PDF`);
          
          // Validate content quality
          const validation = validateExtractedContent(content);
          if (!validation.isValid) {
            console.log(`Content quality warning: ${validation.reason}`);
            // Still use the content but warn about quality
          }
          
          // Clean up the final content
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
        content = `PDF processing failed: ${pdfError.message}. Please try converting the PDF to a text file or check if the file is corrupted.`;
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
        content = `Text extraction failed: ${textError.message}`;
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
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      content: `Content extraction failed: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});