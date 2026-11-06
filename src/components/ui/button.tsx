import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

export type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
    iconPlacement?: "left" | "right";
  };

function renderButtonIcon(
  icon: React.ComponentType<{ className?: string }> | React.ReactNode,
  className?: string
) {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null && "render" in icon)
  ) {
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className={cn("size-4 shrink-0", className)} aria-hidden="true" />;
  }
  return <>{icon}</>;
}

/**
 * Button component supporting variants, sizes, icon placement, and loading state.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  icon,
  iconPlacement = "left",
  disabled,
  children,
  onKeyDown,
  ...props
}: ButtonProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    props.onKeyDown?.(event);
    if ((event.key === " " || event.key === "Space") && !event.defaultPrevented && event.target === event.currentTarget) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span className="opacity-80">{children}</span>
        </>
      ) : (
        <>
          {icon && iconPlacement === "left" && renderButtonIcon(icon)}
          {children}
          {icon && iconPlacement === "right" && renderButtonIcon(icon)}
        </>
      )}
    </ButtonPrimitive>
  );
}

export { Button };

