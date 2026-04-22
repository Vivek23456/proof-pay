"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[proofpay]", error);
  }, [error]);

  return (
    <main className="container max-w-lg py-24">
      <div className="card text-center space-y-3">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-textMuted">
          {error.message || "Unexpected error"}
        </p>
        <Button onClick={reset} variant="ghost" className="mx-auto">
          Try again
        </Button>
      </div>
    </main>
  );
}
