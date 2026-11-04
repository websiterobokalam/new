/** Show enough of a phone or email to recognise it, never the whole thing. */
export function maskContact(v: string | null | undefined) {
  if (!v) return "—";
  if (v.includes("@")) {
    const [user, domain] = v.split("@");
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return `${v.slice(0, 3)}•••••${v.slice(-3)}`;
}
