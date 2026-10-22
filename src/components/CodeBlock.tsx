import React from 'react';
import { Code } from '@components/ui/code';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

/**
 * Composite code block component delegating to the Code UI primitive.
 */
export function CodeBlock({
  children,
  className,
  inline = false,
  ...props
}: CodeBlockProps) {
  return (
    <Code block={!inline} className={className} {...props}>
      {children}
    </Code>
  );
}

export default CodeBlock;

