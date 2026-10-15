import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/src/components/ui/button-variants";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<{
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}>({
  size: "default",
  variant: "default",
});

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ToggleGroupPrimitive.Props & {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("inline-flex items-center gap-1 rounded-lg border border-border p-0.5", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        buttonVariants({
          variant: context.variant || variant || "ghost",
          size: context.size || size || "default",
        }),
        "data-[pressed]:bg-accent data-[pressed]:text-accent-foreground data-[pressed]:shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
