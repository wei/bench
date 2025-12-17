import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonGroupVariants = cva(
  "inline-flex w-fit [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-e-none [&>*:last-child]:rounded-s-none [&>*:not(:first-child)]:border-s-0",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical:
          "flex-col [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:first-child]:rounded-b-none [&>*:first-child]:rounded-e [&>*:first-child]:rounded-s [&>*:last-child]:rounded-t-none [&>*:last-child]:rounded-e [&>*:last-child]:rounded-s [&>*:not(:first-child)]:border-t-0 [&>*:not(:first-child)]:border-s",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>
>(({ className, orientation = "horizontal", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
});
ButtonGroup.displayName = "ButtonGroup";

const buttonGroupSeparatorVariants = cva("shrink-0 bg-border dark:bg-input", {
  variants: {
    orientation: {
      horizontal: "h-full w-px",
      vertical: "h-px w-full",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const ButtonGroupSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    VariantProps<typeof buttonGroupSeparatorVariants>
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-orientation={orientation}
      className={cn(buttonGroupSeparatorVariants({ orientation }), className)}
      {...props}
    />
  );
});
ButtonGroupSeparator.displayName = "ButtonGroupSeparator";

const ButtonGroupText = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & {
    asChild?: boolean;
  }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      ref={ref}
      className={cn("flex items-center px-3 text-sm", className)}
      {...props}
    />
  );
});
ButtonGroupText.displayName = "ButtonGroupText";

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
