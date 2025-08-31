import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { sanitizeInput } from '@/lib/validation';

interface SecureInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SecureInput({
  name,
  label,
  type = 'text',
  placeholder,
  disabled = false,
  className = '',
}: SecureInputProps) {
  const form = useFormContext();

  const handleChange = (value: string) => {
    // Sanitize input on change for XSS protection
    const sanitized = type === 'password' ? value : sanitizeInput(value);
    form.setValue(name, sanitized);
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === 'textarea' ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
                onChange={(e) => {
                  field.onChange(e);
                  handleChange(e.target.value);
                }}
                // Security attributes
                autoComplete="on"
                spellCheck={false}
                maxLength={5000}
              />
            ) : (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
                onChange={(e) => {
                  field.onChange(e);
                  handleChange(e.target.value);
                }}
                // Security attributes
                autoComplete={
                  type === 'password' 
                    ? 'current-password' 
                    : type === 'email' 
                    ? 'email' 
                    : 'on'
                }
                spellCheck={type !== 'password' && type !== 'email'}
                maxLength={type === 'password' ? 128 : 1000}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}