import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Brand-consistent spinner. Wraps lucide's Loader2 with a default size
 * and the standard Tailwind `animate-spin`.
 */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}
