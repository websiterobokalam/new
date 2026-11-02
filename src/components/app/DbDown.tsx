import Link from "next/link";
export function DbDown() {
  return (
    <section className="py-20">
      <div className="wrap max-w-xl text-center">
        <h1 className="display-lg">We can&apos;t load this right now.</h1>
        <p className="lede mt-3">Something on our side is down. Please try again in a few minutes.</p>
        <Link href="/" className="btn btn-primary mt-6">Back home</Link>
      </div>
    </section>
  );
}
