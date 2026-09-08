"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="app-main">
          <section className="error-panel" role="alert">
            <h1>Core Protocol Companion could not render</h1>
            <p>{error.message}</p>
            <button type="button" onClick={reset}>Retry</button>
          </section>
        </main>
      </body>
    </html>
  );
}
