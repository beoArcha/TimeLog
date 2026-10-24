import * as React from 'react';
import { cn } from '@/lib/utils';
import { formVariants, type FormLayout, type FormGap } from './form-variants';

export type FormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  layout?: FormLayout;
  gap?: FormGap;
  preventDefault?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
};

/**
 * Semantic Form component providing standardized layout, accessible role, and form submission ergonomics.
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      layout = 'vertical',
      gap = 'md',
      preventDefault = true,
      noValidate = true,
      role = 'form',
      onSubmit,
      children,
      ...props
    },
    ref
  ) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      if (preventDefault) {
        e.preventDefault();
      }
      onSubmit?.(e);
    };

    return (
      <form
        ref={ref}
        role={role}
        noValidate={noValidate}
        onSubmit={handleSubmit}
        data-slot="form"
        className={cn(
          formVariants({ layout: layout as FormLayout, gap: gap as FormGap }),
          className
        )}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export default Form;
