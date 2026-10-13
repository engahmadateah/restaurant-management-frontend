import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-wine-600)] text-white hover:bg-[var(--color-wine-700)]",
        gold: "bg-[var(--color-gold-500)] text-[var(--color-ink)] hover:bg-[var(--color-gold-600)]",
        outline: "border border-[var(--color-line)] bg-transparent hover:bg-[var(--color-wine-50)] text-[var(--color-ink)]",
        ghost: "hover:bg-[var(--color-wine-50)] text-[var(--color-ink)]",
        danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
        link: "text-[var(--color-wine-600)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
