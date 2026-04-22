"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90",
  ghost: "bg-transparent text-text border border-border hover:bg-surfaceRaised",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? "…" : children}
    </button>
  ),
);
Button.displayName = "Button";
