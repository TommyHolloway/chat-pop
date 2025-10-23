import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ProductRecommendationCard } from './ProductRecommendationCard';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage = ({ content, className }: MarkdownMessageProps) => {
  // Check if content contains product card data
  const productMatch = content.match(/\[PRODUCT_CARD:(.+?)\]/s);
  
  if (productMatch) {
    try {
      const productData = JSON.parse(productMatch[1]);
      const textContent = content.replace(/\[PRODUCT_CARD:.+?\]/s, '').trim();
      
      return (
        <div className={cn(className, "space-y-3")}>
          {textContent && (
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg font-semibold text-foreground mb-2 mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-foreground mb-2 mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-foreground mb-1 mt-0">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-foreground mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground">{children}</em>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-muted p-2 rounded text-xs font-mono text-foreground whitespace-pre overflow-x-auto">
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {textContent}
            </ReactMarkdown>
          )}
          <ProductRecommendationCard product={productData} />
        </div>
      );
    } catch (e) {
      console.error('Failed to parse product data:', e);
      // Fall through to render as normal markdown
    }
  }
  
  return (
    <div className={cn(className)}>
      <ReactMarkdown
        components={{
        // Style headings with design system colors
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold text-foreground mb-2 mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-foreground mb-2 mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-foreground mb-1 mt-0">{children}</h3>
        ),
        
        // Style paragraphs
        p: ({ children }) => (
          <p className="text-sm text-foreground mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
        ),
        
        // Style bold and italic
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground">{children}</em>
        ),
        
        // Style code
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
              {children}
            </code>
          ) : (
            <code className="block bg-muted p-2 rounded text-xs font-mono text-foreground whitespace-pre overflow-x-auto">
              {children}
            </code>
          );
        },
        
        // Style lists
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-foreground">{children}</li>
        ),
        
        // Style links
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            {children}
          </a>
        ),
        
        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};