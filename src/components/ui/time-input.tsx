import * as React from "react";
import { Clock } from "lucide-react";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";
import type { InputSize } from "./input-variants";

export type TimeInputProps = Omit<InputProps, "size"> & {
  size?: InputSize;
  showIcon?: boolean;
  containerClassName?: string;
};

/**
 * Accessible, formatted time input primitive component.
 */
const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, containerClassName, size = "md", showIcon = true, type = "time", ...props }: TimeInputProps, ref) => {
    if (!showIcon) {
      return (
        <Input
          ref={ref}
          type={type}
          size={size}
          data-slot="time-input"
          className={cn("font-mono", className)}
          {...props}
        />
      );
    }

    const iconSizeClasses = {
      sm: "left-2 h-3 w-3",
      md: "left-2.5 h-3.5 w-3.5",
      lg: "left-3 h-4 w-4",
    }[size];

    const inputPaddingClasses = {
      sm: "pl-7",
      md: "pl-8",
      lg: "pl-9",
    }[size];

    return (
      <div
        data-slot="time-input-container"
        className={cn("relative flex items-center w-full min-w-0", containerClassName)}
      >
        <Clock
          className={cn(
            "absolute text-muted-foreground pointer-events-none select-none",
            iconSizeClasses
          )}
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type={type}
          size={size}
          data-slot="time-input"
          className={cn("font-mono", inputPaddingClasses, className)}
          {...props}
        />
      </div>
    );
  }
);
TimeInput.displayName = "TimeInput";

export { TimeInput };
