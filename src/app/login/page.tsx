import type { Metadata } from "next";
import { doors } from "@/content/site";
import { DoorLink } from "@/components/motion/DoorTransition";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="py-12 sm:py-20">
      <div className="wrap">
        <p className="eyebrow text-center">Login</p>
        <h1 className="display-lg mt-3 text-center">Which door is yours?</h1>
        <ul className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {doors.map((d) => (
            <li key={d.id} data-door-card className="card grad-border flex flex-col p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-muted">{d.who}</p>
              <h2 className="mt-1 text-3xl font-bold">{d.name}</h2>
              <DoorLink href={d.login} className="btn btn-primary mt-6">{d.name} login <span aria-hidden>→</span></DoorLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
