"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="py-24">
      <div className="wrap max-w-xl text-center">
        <h1 className="display-lg">Something short-circuited.</h1>
        <p className="lede mt-3">It is on us, not you. Try again.</p>
        <button onClick={reset} className="btn btn-primary mt-8">Try again</button>
      </div>
    </section>
  );
}
