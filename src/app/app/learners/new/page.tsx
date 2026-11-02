import { appContext } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { getNotice } from "@/lib/learn/consent";
import { AddLearner } from "@/components/app/AddLearner";

export const metadata = { title: "Add a learner" };

export default async function NewLearner() {
  const { account, t } = await appContext("/app/learners/new");
  const notice = await asAccount(account, (c) => getNotice(c, account.language));
  return (
    <section className="py-10">
      <div className="wrap max-w-3xl">
        <p className="eyebrow">{t.add_learner}</p>
        <h1 className="display-lg mt-2">Add a learner</h1>
        <div className="card mt-8 p-5 sm:p-8">
          {account.adult ? <AddLearner notice={notice} /> : <p>Only an adult parent or guardian can add a learner. Please log in again and confirm you are 18 or older.</p>}
        </div>
      </div>
    </section>
  );
}
