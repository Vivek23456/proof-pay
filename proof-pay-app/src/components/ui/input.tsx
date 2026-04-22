"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-surfaceRaised border border-border px-3 py-2 text-sm text-text",
        "placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accent/50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
