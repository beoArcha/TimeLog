import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 [&>svg]:text-amber-500",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 [&>svg]:text-emerald-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
