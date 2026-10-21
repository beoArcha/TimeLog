import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono",
        muted: "border-transparent bg-muted text-muted-foreground",
        amber:
          "border-amber-500/25 bg-amber-500/10 text-amber-500 font-bold font-mono",
        emerald:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-bold font-mono",
        orange:
          "border-orange-500/30 bg-orange-500/20 text-orange-500 font-bold font-mono",
        violet:
          "border-violet-500/30 bg-violet-500/20 text-violet-400 font-bold font-mono",
        teal:
          "border-teal-500/30 bg-teal-500/20 text-teal-400 font-bold font-mono",
        rose:
          "border-rose-500/30 bg-rose-500/20 text-rose-500 font-bold font-mono",
      },
      size: {
        xs: "px-1.5 py-0.2 text-[9px]",
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
