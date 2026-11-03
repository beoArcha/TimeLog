import { cva } from "class-variance-authority";

export const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      6: "grid-cols-6",
      12: "grid-cols-12",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1.5",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
      "2xl": "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    cols: 1,
    gap: "md",
  },
});
