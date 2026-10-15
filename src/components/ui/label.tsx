import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-xs font-semibold leading-none select-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "",
        muted: "text-muted-foreground font-normal",
        error: "text-destructive font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type LabelProps = React.ComponentProps<typeof Field.Label> &
  VariantProps<typeof labelVariants>;

/**
 * Form label component for associated form controls.
 */
function Label({ className, variant, ...props }: LabelProps) {
  return (
    <Field.Label
      data-slot="label"
      className={cn(labelVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Label, labelVariants };
