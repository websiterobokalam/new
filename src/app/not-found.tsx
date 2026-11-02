import Link from "next/link";
import { KalamBot } from "@/components/art/Small";

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="wrap max-w-xl text-center">
        <KalamBot className="mx-auto h-24 w-24" />
        <h1 className="display-lg mt-6">This line goes nowhere.</h1>
        <p className="lede mt-3">The page moved or never existed. Pick a door instead.</p>
        <Link href="/" className="btn btn-primary mt-8">Back home</Link>
      </div>
    </section>
  );
}
