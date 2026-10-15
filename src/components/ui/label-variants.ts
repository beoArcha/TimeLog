import { cva } from "class-variance-authority";

export const labelVariants = cva(
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
