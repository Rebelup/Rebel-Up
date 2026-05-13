"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h2 className="text-xl font-bold text-destructive">에러 발생</h2>
      <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded max-w-xl break-all">
        {error.message}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
      >
        다시 시도
      </button>
    </div>
  );
}
