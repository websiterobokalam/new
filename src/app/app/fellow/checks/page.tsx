import { fellowContext } from "@/lib/fellows/context";
import { JsonForm } from "@/components/app/JsonForm";
import { ReferencesForm } from "@/components/fellow/ReferencesForm";

export const metadata = { title: "Checks" };

export default async function ChecksPage() {
  const { steps } = await fellowContext("/app/fellow/checks");
  void JsonForm;
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Step 3 · Identity, background and references</p><h1 className="display-lg mt-2">The checks that keep kids safe.</h1>
        <p className="lede mt-2">Every Kalamite passes these before any contact with a child. No exceptions.</p></header>
      <div className="card grid gap-3 p-6">
        <h2 className="text-xl font-bold">Identity and background</h2>
        <p className="text-muted">Done through a licensed verification partner (DigiLocker where possible). We store only the result and the partner&apos;s reference, never copies of your documents. Our team will send you a secure link.</p>
        <p className="text-sm">Identity: <strong>{steps.identity.status}</strong> · Background: <strong>{steps.background.status}</strong></p>
      </div>
      <div className="card grid gap-3 p-6">
        <h2 className="text-xl font-bold">Two references</h2>
        <p className="text-muted">A teacher, professor, mentor or employer who knows you. Not family.</p>
        {steps.references.status === "pending" ? <ReferencesForm /> : <p>References: <strong>{steps.references.status}</strong></p>}
      </div>
    </div></section>
  );
}
