"use client";

import { ErrorPanel } from "@/components/comic/ComicPrimitives";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPanel title="This panel misfired">
      <p>{error.message}</p>
      <button type="button" onClick={reset}>Retry</button>
    </ErrorPanel>
  );
}
