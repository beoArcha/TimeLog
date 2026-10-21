import React from 'react';
import { cn } from '@/lib/utils';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

/**
 * Semantic code container styled with design tokens for console and documentation snippets.
 */
export function CodeBlock({
  children,
  className,
  inline = false,
  ...props
}: CodeBlockProps) {
  if (inline) {
    return (
      <code
        className={cn(
          'bg-code-bg border border-code-border text-code-foreground font-mono text-xs px-1.5 py-0.5 rounded select-all',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <pre
      className={cn(
        'bg-code-bg border border-code-border text-code-foreground font-mono text-xs p-3 rounded-xl overflow-x-auto leading-relaxed select-all',
        className
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}

export default CodeBlock;
