import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getDocument } from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs';

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
        console.log('Starting enhanced PDF extraction using PDF.js');
        const fileBuffer = await fileData.arrayBuffer();
        
        // Use PDF.js for proper PDF parsing
        const pdf = await getDocument({
          data: new Uint8Array(fileBuffer),
          useSystemFonts: false,
          disableFontFace: true,
          verbosity: 0
        }).promise;
        
        console.log(`PDF has ${pdf.numPages} pages`);
        
        const textContent = [];
        const metadata = await pdf.getMetadata();
        
        // Add document metadata if available
        if (metadata?.info) {
          const info = metadata.info;
          if (info.Title) textContent.push(`Title: ${info.Title}`);
          if (info.Subject) textContent.push(`Subject: ${info.Subject}`);
          if (info.Author) textContent.push(`Author: ${info.Author}`);
          if (info.Keywords) textContent.push(`Keywords: ${info.Keywords}`);
          textContent.push('---'); // Separator
        }
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textData = await page.getTextContent();
            
            console.log(`Processing page ${pageNum} with ${textData.items.length} text items`);
            
            // Sort items by Y position (top to bottom) then X position (left to right)
            const sortedItems = textData.items
              .filter(item => item.str && item.str.trim().length > 0)
              .sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5]; // Y position (inverted for top-to-bottom)
                if (Math.abs(yDiff) > 5) return yDiff > 0 ? 1 : -1; // Different lines
                return a.transform[4] - b.transform[4]; // Same line, sort by X position
              });
            
            // Group items into lines and build readable text
            const lines = [];
            let currentLine = [];
            let lastY = null;
            
            for (const item of sortedItems) {
              const currentY = Math.round(item.transform[5]);
              const text = item.str.trim();
              
              // Clean up text
              const cleanText = text
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
              
              if (!cleanText) continue;
              
              // If this is a new line (Y position changed significantly)
              if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                if (currentLine.length > 0) {
                  const lineText = currentLine.join(' ').trim();
                  if (lineText.length > 0) {
                    lines.push(lineText);
                  }
                  currentLine = [];
                }
              }
              
              currentLine.push(cleanText);
              lastY = currentY;
            }
            
            // Add the last line
            if (currentLine.length > 0) {
              const lineText = currentLine.join(' ').trim();
              if (lineText.length > 0) {
                lines.push(lineText);
              }
            }
            
            if (lines.length > 0) {
              textContent.push(`--- Page ${pageNum} ---`);
              textContent.push(...lines);
              console.log(`Extracted ${lines.length} lines from page ${pageNum}`);
            }
            
            // Cleanup page resources
            page.cleanup();
          } catch (pageError) {
            console.error(`Error extracting page ${pageNum}:`, pageError);
            textContent.push(`[Error extracting page ${pageNum}: ${pageError.message}]`);
          }
        }
        
        // Cleanup PDF resources
        pdf.destroy();
        
        extractedContent = textContent.join('\n').trim();
        
        // Validate content quality
        const validationResult = validateExtractedContent(extractedContent);
        console.log(`Content validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'} - ${validationResult.reason}`);
        
        // If content validation fails, the extracted content might be corrupted
        if (!validationResult.isValid) {
          console.log('Content appears corrupted, attempting fallback extraction');
          throw new Error(`Content validation failed: ${validationResult.reason}`);
        }
        
        // Post-processing: clean up and structure the content
        if (extractedContent) {
          // Remove excessive whitespace
          extractedContent = extractedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          // Detect and format tables (basic detection)
          extractedContent = extractedContent.replace(/(\$[\d,]+\.?\d*)\s+(\$[\d,]+\.?\d*)/g, '$1 | $2');
          
          // Clean up common PDF artifacts but preserve readability
          extractedContent = extractedContent.replace(/\s+/g, ' '); // Normalize spaces
          extractedContent = extractedContent.replace(/\n /g, '\n'); // Remove leading spaces on lines
        }
        
        console.log(`Enhanced PDF extraction completed. Content length: ${extractedContent.length} characters`);
        
      } catch (pdfError) {
        console.error('Enhanced PDF extraction error:', pdfError);
        
        // Fallback to basic extraction if PDF.js fails
        try {
          console.log('Falling back to basic text extraction');
          const fileBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(fileBuffer);
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
            extractedContent = 'PDF content extraction failed. Complex PDF structure detected.';
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
          extractedContent = 'PDF content extraction failed. File uploaded but content not accessible.';
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