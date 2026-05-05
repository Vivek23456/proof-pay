import { cn } from "@/lib/cn";

/**
 * Shimmer skeleton placeholder. Pair with a fixed width/height via className.
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-24 w-full rounded-2xl" />
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block rounded-md bg-[length:200%_100%] animate-shimmer",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(35,40,54,0.6) 0%, rgba(70,76,98,0.55) 50%, rgba(35,40,54,0.6) 100%)",
      }}
    />
  );
}
