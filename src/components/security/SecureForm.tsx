import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { checkRateLimit, handleValidationError } from '@/lib/validation';
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

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (data: z.infer<T>) => {
    // Rate limiting check
    if (rateLimitKey && !checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
      toast.error('Too many requests. Please try again later.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Additional client-side validation
      const validatedData = schema.parse(data);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = handleValidationError(error);
        Object.entries(errors).forEach(([field, message]) => {
          form.setError(field as any, { message });
        });
      } else {
        console.error('Form submission error:', error);
        toast.error('An error occurred. Please try again.');
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