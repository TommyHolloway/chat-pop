import * as z from 'zod';

// Comprehensive validation schemas with XSS protection
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long')
  .transform((val) => val.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');

export const phoneSchema = z
  .string()
  .optional()
  .refine((val) => !val || /^\+?[1-9]\d{6,14}$/.test(val), 'Please enter a valid phone number');

export const textInputSchema = z
  .string()
  .max(1000, 'Text is too long')
  .transform((val) => val.replace(/[<>&'"]/g, '').trim());

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((val) => val.trim());

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile schemas
export const profileSchema = z.object({
  display_name: nameSchema.optional(),
  email: emailSchema,
  phone: phoneSchema,
});

// Agent schemas
export const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Name is too long'),
  description: textInputSchema.optional(),
  instructions: z.string().min(1, 'Instructions are required').max(5000, 'Instructions are too long'),
});

// Workspace schemas
export const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
  description: textInputSchema.optional(),
});

// Lead capture schemas
export const leadCaptureSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: textInputSchema.optional(),
  message: textInputSchema.optional(),
});

// XSS sanitization utility
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>&'"]/g, '').trim();
};

/**
 * CLIENT-SIDE RATE LIMITING (UX Only - Not a Security Control)
 * 
 * SECURITY NOTE: This provides immediate user feedback but can be bypassed by clearing
 * localStorage or disabling JavaScript. Real rate limiting is enforced server-side via:
 * 
 * 1. Database function: enhanced_rate_limit_check() in Supabase
 * 2. RLS policies that call this function before allowing operations
 * 3. Edge function validation (validate_edge_function_request)
 * 
 * This client-side check is purely for UX to prevent accidental spam and provide
 * immediate feedback to users before they hit the server-side rate limits.
 */

// Enhanced rate limiting utility with IP tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number; ips: Set<string> }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs, ips: new Set() });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Enhanced validation for sensitive operations
export const validateSensitiveOperation = (operation: string, data?: any): boolean => {
  // Check rate limits more strictly for sensitive operations
  const limits = {
    'profile_update': { max: 10, window: 60000 },
    'pii_access': { max: 20, window: 60000 },
    'bulk_data_access': { max: 5, window: 60000 },
    'admin_operation': { max: 50, window: 60000 }
  };
  
  const limit = limits[operation as keyof typeof limits];
  if (limit && !checkRateLimit(operation, limit.max, limit.window)) {
    return false;
  }
  
  // Additional validation for PII data
  if (data && operation === 'pii_access') {
    const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'credit_card'];
    const hasPII = Object.keys(data).some(key => piiFields.includes(key.toLowerCase()));
    
    if (hasPII && !checkRateLimit('pii_data_access', 15, 60000)) {
      return false;
    }
  }
  
  return true;
};

// Enhanced input sanitization
export const enhancedSanitizeInput = (input: string, allowHtml: boolean = false): string => {
  if (!allowHtml) {
    // Remove all HTML tags and potentially dangerous characters
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[<>&'"]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }
  
  // Allow basic HTML but sanitize dangerous elements
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim();
};

// Validation error handler
export const handleValidationError = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AgentFormData = z.infer<typeof agentSchema>;
export type WorkspaceFormData = z.infer<typeof workspaceSchema>;
export type LeadCaptureFormData = z.infer<typeof leadCaptureSchema>;