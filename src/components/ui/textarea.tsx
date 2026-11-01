import * as React from "react";
import { cn } from "@/lib/utils";
import { textareaVariants, type InputSize } from "./input-variants";

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  size?: InputSize;
};

/**
 * Multiline text input primitive component with scalable UiSize variants.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "md", ...props }: TextareaProps, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(textareaVariants({ size }), className)}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
