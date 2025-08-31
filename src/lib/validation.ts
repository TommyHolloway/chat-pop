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
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

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

// Rate limiting utility
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
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