import { cva } from "class-variance-authority";

export const kbdVariants = cva(
  "inline-flex items-center justify-center font-mono font-medium select-none border transition-colors shadow-2xs",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        outline: "border-border bg-background text-foreground",
        secondary: "border-border/60 bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        ghost: "border-transparent bg-transparent text-foreground",
      },
      size: {
        xs: "h-4 min-w-4 px-1 text-[10px] rounded-xs",
        sm: "h-5 min-w-5 px-1.5 text-xs rounded-sm",
        md: "h-6 min-w-6 px-2 text-xs rounded-md",
        lg: "h-7 min-w-7 px-2.5 text-sm rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
