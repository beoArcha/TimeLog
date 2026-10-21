import { cva } from "class-variance-authority";

export const stackVariants = cva("flex", {
  variants: {
    direction: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    gap: {
      none: "gap-0",
      "3xs": "gap-0.5",
      "2xs": "gap-1",
      xs: "gap-1.5",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
      "2xl": "gap-8",
      section: "gap-10",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
    inline: {
      true: "inline-flex",
      false: "flex",
    },
  },
  defaultVariants: {
    direction: "horizontal",
    align: "center",
    justify: "start",
    gap: "sm",
    wrap: false,
    inline: false,
  },
});
