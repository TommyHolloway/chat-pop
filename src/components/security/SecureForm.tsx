import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { checkRateLimit, handleValidationError, enhancedSanitizeInput } from '@/lib/validation';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

interface SecureFormProps<T extends z.ZodSchema> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  rateLimitKey?: string;
  maxRequests?: number;
  windowMs?: number;
}

export function SecureForm<T extends z.ZodSchema>({
  schema,
  onSubmit,
  children,
  className = '',
  rateLimitKey,
  maxRequests = 5,
  windowMs = 60000,
}: SecureFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateOperation, logSecurityEvent } = useEnhancedSecurity();

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (data: z.infer<T>) => {
    // Enhanced security validation
    if (rateLimitKey) {
      const validation = await validateOperation(rateLimitKey, data);
      if (!validation.allowed) {
        toast.error(validation.reason || 'Security validation failed');
        if (validation.severity === 'critical' || validation.severity === 'high') {
          await logSecurityEvent('form_submission_blocked', { 
            rateLimitKey, 
            reason: validation.reason 
          }, validation.severity);
        }
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Enhanced client-side validation with sanitization
      const sanitizedData = { ...data };
      
      // Sanitize string fields
      Object.keys(sanitizedData).forEach(key => {
        const value = sanitizedData[key];
        if (typeof value === 'string') {
          sanitizedData[key] = enhancedSanitizeInput(value) as any;
        }
      });
      
      const validatedData = schema.parse(sanitizedData);
      await onSubmit(validatedData);
      
      // Log successful secure form submission
      await logSecurityEvent('secure_form_submission_success', { rateLimitKey }, 'low');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = handleValidationError(error);
        Object.entries(errors).forEach(([field, message]) => {
          form.setError(field as any, { message });
        });
        await logSecurityEvent('form_validation_error', { 
          rateLimitKey, 
          errorCount: error.errors.length 
        }, 'low');
      } else {
        console.error('Form submission error:', error);
        toast.error('An error occurred. Please try again.');
        await logSecurityEvent('form_submission_error', { 
          rateLimitKey, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'medium');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className={className}
        // Security headers
        autoComplete="on"
        noValidate={false}
      >
        {children}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Processing...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}