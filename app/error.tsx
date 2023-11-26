"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[95vh] flex justify-center ">
      <p className="text-center mt-4 text-semibold">Something went wrong</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
