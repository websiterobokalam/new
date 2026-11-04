import { redirect } from "next/navigation";
import { currentAccount } from "../auth/session";
import { getFellow } from "./core";

/** For /app/fellow pages: signed-in Kalamite, or a redirect to log in or apply. */
export async function fellowContext(next: string) {
  const account = await currentAccount();
  if (!account) redirect(`/login/educator?next=${encodeURIComponent(next)}`);
  const f = await getFellow(account);
  if (!f) redirect("/kalamites/apply");
  return { account, ...f };
}
