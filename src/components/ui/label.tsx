import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { labelVariants } from "./label-variants";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> &
  VariantProps<typeof labelVariants>;

/**
 * Form label component for associated form controls.
 */
function Label({ className, variant, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(labelVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Label };

