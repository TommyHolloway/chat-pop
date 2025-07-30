import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure PDF.js for Deno environment - set worker source before any PDF operations
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs";

// Enhanced PDF text extraction using pdf.js
async function extractPDFTextWithPdfJs(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF.js text extraction');
    
    // Load the PDF document with Deno-compatible configuration
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: false,
      useWorkerFetch: false,
      isEvalSupported: false,
      cMapUrl: 'https://esm.sh/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully, ${pdf.numPages} pages`);
    
    let extractedText = '';
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items with proper spacing
        let pageText = '';
        let lastY = null;
        
        for (const item of textContent.items) {
          if ('str' in item) {
            // Add line break if we moved to a new line (different Y position)
            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
              pageText += '\n';
            }
            
            // Add the text with a space if needed
            if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            
            pageText += item.str;
            lastY = item.transform[5];
          }
        }
        
        if (pageText.trim()) {
          extractedText += pageText.trim() + '\n\n';
        }
        
        console.log(`Extracted text from page ${pageNum}: ${pageText.length} characters`);
        
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }
    
    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
      .trim();
    
    console.log(`PDF.js extraction completed: ${cleanedText.length} characters`);
    return cleanedText;
    
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
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
      console.log('Processing PDF file with pdf.js');
      
      try {
        content = await extractPDFTextWithPdfJs(fileBuffer);
        
        if (!content || content.length < 20) {
          console.log('PDF.js extraction yielded minimal content, trying fallback');
          content = await extractPDFTextFallback(fileBuffer);
        }
        
        if (!content || content.length < 20) {
          content = 'Content extraction failed: PDF appears to be empty, encrypted, or image-based. Please try converting it to a text file first.';
        } else {
          console.log(`Successfully extracted ${content.length} characters from PDF`);
          
          // Validate content quality
          const validation = validateExtractedContent(content);
          if (!validation.isValid) {
            console.log(`Content quality warning: ${validation.reason}`);
          }
        }
        
      } catch (pdfError) {
        console.error('PDF processing failed:', pdfError);
        content = `PDF processing failed: ${pdfError.message}. Please try converting the PDF to a text file.`;
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