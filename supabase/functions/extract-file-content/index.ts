import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function to decompress FlateDecode streams
const decompressFlateDecode = async (data: Uint8Array): Promise<string> => {
  try {
    console.log(`Attempting to decompress FlateDecode data, length: ${data.length}`);
    
    // Use Deno's built-in DecompressionStream for deflate decompression
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      }
    });
    
    const decompressed = readable.pipeThrough(new DecompressionStream('deflate-raw'));
    const chunks: Uint8Array[] = [];
    const reader = decompressed.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    
    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    const decompressed_str = new TextDecoder('latin1').decode(result);
    console.log(`Decompression successful, output length: ${decompressed_str.length}`);
    return decompressed_str;
  } catch (error) {
    console.log(`FlateDecode decompression failed: ${error.message}`);
    // Fallback to treating as uncompressed
    return new TextDecoder('latin1').decode(data);
  }
};

// Helper function to extract text from PDF streams
const extractTextFromStream = async (streamData: string, streamDict: string): Promise<string[]> => {
  const textObjects = [];
  let processedStreamData = streamData;
  
  // Check if stream uses FlateDecode compression
  const isCompressed = streamDict.includes('/FlateDecode') || streamDict.includes('/Fl');
  
  if (isCompressed) {
    console.log('Detected compressed stream (FlateDecode)');
    try {
      // Convert stream data to Uint8Array for decompression
      const encoder = new TextEncoder();
      const streamBytes = encoder.encode(streamData);
      
      // Decompress the stream
      processedStreamData = await decompressFlateDecode(streamBytes);
      console.log(`Stream decompressed from ${streamData.length} to ${processedStreamData.length} characters`);
    } catch (error) {
      console.log(`Stream decompression failed: ${error.message}, using original data`);
      processedStreamData = streamData;
    }
  }
  
  // Extract text using various patterns
  const patterns = [
    /\(([^)]{2,})\)/g,           // Text in parentheses
    /\[([^\]]{3,})\]/g,          // Text in square brackets
    /<([^>]{3,})>/g,             // Text in angle brackets (hex strings)
    /\/([A-Za-z]{3,})/g,         // Font names and identifiers
  ];
  
  for (const pattern of patterns) {
    const matches = processedStreamData.match(pattern);
    if (matches) {
      for (const match of matches) {
        let text = match.slice(1, -1); // Remove brackets/parentheses
        
        // Handle hex strings in angle brackets
        if (match.startsWith('<') && match.endsWith('>')) {
          try {
            // Convert hex to text
            text = text.replace(/([0-9A-Fa-f]{2})/g, (hex) => 
              String.fromCharCode(parseInt(hex, 16))
            );
          } catch (e) {
            continue; // Skip if hex conversion fails
          }
        }
        
        // Filter out font names and non-text content
        if (text.length > 2 && 
            !/^[0-9\s\.\-\/]+$/.test(text) && 
            !/^[A-Z]{2,}[0-9]*$/.test(text) &&
            /[a-zA-Z]/.test(text)) {
          textObjects.push(text);
        }
      }
    }
  }
  
  return textObjects;
};

// Enhanced PDF text extraction function
const extractPDFText = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    const uint8Array = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false }).decode(uint8Array);
    
    console.log('Starting enhanced PDF text extraction');
    
    const extractedTexts: string[] = [];
    
    // Method 1: Extract from stream objects with better parsing
    const streamPattern = /(\d+\s+\d+\s+obj[^]*?)?stream\s*(.*?)\s*endstream/gs;
    let streamMatch;
    let streamCount = 0;
    
    while ((streamMatch = streamPattern.exec(text)) !== null) {
      streamCount++;
      const streamHeader = streamMatch[1] || '';
      const streamData = streamMatch[2];
      
      console.log(`Processing stream ${streamCount}, header length: ${streamHeader.length}, data length: ${streamData.length}`);
      
      // Extract text from this stream
      const streamTexts = await extractTextFromStream(streamData, streamHeader);
      extractedTexts.push(...streamTexts);
    }
    
    // Method 2: Look for text objects between BT...ET markers
    const btPattern = /BT\s*(.*?)\s*ET/gs;
    let btMatch;
    let btCount = 0;
    
    while ((btMatch = btPattern.exec(text)) !== null) {
      btCount++;
      const textContent = btMatch[1];
      
      // Extract text from text objects
      const textPatterns = [
        /\(([^)]{1,})\)\s*Tj/g,          // Show text operator
        /\(([^)]{1,})\)\s*TJ/g,          // Show text with spacing
        /\[([^\]]+)\]\s*TJ/g,            // Array of strings with positioning
      ];
      
      for (const pattern of textPatterns) {
        const matches = textContent.match(pattern);
        if (matches) {
          for (const match of matches) {
            let textStr = '';
            if (match.startsWith('(')) {
              textStr = match.match(/\(([^)]*)\)/)?.[1] || '';
            } else if (match.startsWith('[')) {
              // Handle array format: extract all text strings
              const arrayContent = match.match(/\[([^\]]+)\]/)?.[1] || '';
              const strings = arrayContent.match(/\(([^)]*)\)/g) || [];
              textStr = strings.map(s => s.slice(1, -1)).join('');
            }
            
            if (textStr && textStr.length > 1) {
              extractedTexts.push(textStr);
            }
          }
        }
      }
    }
    
    console.log(`Found ${streamCount} streams and ${btCount} text objects`);
    
    // Method 3: Direct pattern matching for common text patterns
    const directPatterns = [
      /\(([A-Za-z][^)]{5,})\)/g,       // Text in parentheses (at least 6 chars, starts with letter)
      /\[[^\]]*\(([^)]{3,})\)[^\]]*\]/g, // Text in arrays
    ];
    
    for (const pattern of directPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const textMatch = match.match(/\(([^)]{3,})\)/);
          if (textMatch) {
            extractedTexts.push(textMatch[1]);
          }
        }
      }
    }
    
    // Clean and process extracted text
    const cleanedTexts = extractedTexts
      .filter(text => text && text.trim().length > 0)
      .map(text => {
        // Decode PDF escape sequences
        return text
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
          .replace(/\\(.)/g, '$1')
          .replace(/[^\x20-\x7E\s\n\r\t]/g, '') // Keep only printable ASCII + whitespace
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter(text => 
        text.length > 2 && 
        !/^[0-9\s\.\-\/,]+$/.test(text) && // Skip pure numbers/punctuation
        /[a-zA-Z]/.test(text) // Must contain at least one letter
      );
    
    const finalText = cleanedTexts.join(' ').replace(/\s+/g, ' ').trim();
    
    console.log(`Extracted ${cleanedTexts.length} text segments, final length: ${finalText.length} characters`);
    
    return finalText;
  } catch (error) {
    console.error('Enhanced PDF text extraction error:', error);
    throw error;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced content validation function
function validateExtractedContent(content: string): { isValid: boolean; reason: string } {
  if (!content || content.length === 0) {
    return { isValid: false, reason: 'No content extracted' };
  }
  
  console.log(`Validating content: ${content.length} characters`);
  
  // Check for minimum reasonable length
  if (content.length < 10) {
    return { isValid: false, reason: 'Content too short (likely failed extraction)' };
  }
  
  // Check for excessive binary/control characters (more lenient for PDFs)
  const binaryCharCount = (content.match(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g) || []).length;
  const binaryRatio = binaryCharCount / content.length;
  if (binaryRatio > 0.2) {
    console.log(`High binary character ratio detected: ${(binaryRatio * 100).toFixed(1)}%`);
    return { isValid: false, reason: `High binary character ratio: ${(binaryRatio * 100).toFixed(1)}%` };
  }
  
  // Check for readable text patterns (more flexible)
  const readableChars = content.match(/[a-zA-Z0-9\s\.,!?;:()\-\n\r\t]/g) || [];
  const readableRatio = readableChars.length / content.length;
  if (readableRatio < 0.5) {
    console.log(`Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%`);
    return { isValid: false, reason: `Low readable character ratio: ${(readableRatio * 100).toFixed(1)}%` };
  }
  
  // Check for letter content - must have some actual letters
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letterCount / content.length;
  if (letterRatio < 0.1) {
    console.log(`Very low letter ratio: ${(letterRatio * 100).toFixed(1)}%`);
    return { isValid: false, reason: `Content contains very few letters: ${(letterRatio * 100).toFixed(1)}%` };
  }
  
  // Check for common corrupted patterns (updated patterns)
  const corruptedPatterns = [
    /^[A-Za-z0-9+/=]{200,}$/, // Very long base64-like strings
    /^[!@#$%^&*()_+={}\[\]|\\:";'<>?,./]{50,}/, // Long strings of symbols only
    /\x00{10,}/, // Long null character sequences
    /^[\x80-\xFF]{50,}/, // Long sequences of high-bit characters
  ];
  
  for (const pattern of corruptedPatterns) {
    if (pattern.test(content.substring(0, 1000))) {
      console.log('Content matches corruption pattern');
      return { isValid: false, reason: 'Content appears corrupted (matches corruption pattern)' };
    }
  }
  
  // Check for repetitive patterns that suggest extraction failure
  const words = content.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 5) {
    const uniqueWords = new Set(words);
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio < 0.3) {
      console.log(`High repetition detected, unique word ratio: ${(uniqueRatio * 100).toFixed(1)}%`);
      return { isValid: false, reason: `Content appears highly repetitive: ${(uniqueRatio * 100).toFixed(1)}% unique words` };
    }
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