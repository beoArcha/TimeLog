import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";
import { inputVariants, type InputSize } from "./input-variants";

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: InputSize;
}

/**
 * Single-line text input primitive component with scalable UiSize variants.
 */
function Input({ className, type = "text", size = "md", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input };
