import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Optimized Image Component
 * Automatically applies performance best practices for image loading
 */
export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  priority = false, 
  sizes,
  ...props 
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      {...props}
    />
  );
}
