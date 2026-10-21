import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { alertVariants } from "./alert-variants";

export type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    as?: "div" | "section" | "aside";
  };

function Alert({
  className,
  variant,
  as: Component = "div",
  ...props
}: AlertProps) {
  return (
    <Component
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export type AlertTitleProps = React.ComponentProps<"h5"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
};

function AlertTitle({
  className,
  as: Component = "h5",
  ...props
}: AlertTitleProps) {
  return (
    <Component
      data-slot="alert-title"
      className={cn("mb-1 font-bold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export type AlertDescriptionProps = React.ComponentProps<"div"> & {
  as?: "div" | "p";
};

function AlertDescription({
  className,
  as: Component = "div",
  ...props
}: AlertDescriptionProps) {
  return (
    <Component
      data-slot="alert-description"
      className={cn("text-xs leading-relaxed opacity-90", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };

