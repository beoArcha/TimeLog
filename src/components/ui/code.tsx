import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { codeVariants } from './code-variants';

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {
  as?: 'code' | 'pre';
}

/**
 * Semantic code primitive supporting inline and block formatting with design tokens.
 */
export const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant, size, block = false, as, children, ...props }, ref) => {
    if (block || as === 'pre') {
      return (
        <pre
          ref={ref as React.Ref<HTMLPreElement>}
          data-slot="code-block"
          className={cn(codeVariants({ variant, size, block: true }), className)}
          {...props}
        >
          <code>{children}</code>
        </pre>
      );
    }

    return (
      <code
        ref={ref as React.Ref<HTMLElement>}
        data-slot="code-inline"
        className={cn(codeVariants({ variant, size, block: false }), className)}
        {...props}
      >
        {children}
      </code>
    );
  }
);

Code.displayName = 'Code';

export default Code;
