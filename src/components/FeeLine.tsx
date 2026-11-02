import { inr } from "@/lib/money";

/** Fee display: never shows an unpublished price; sample fees are labelled. */
export function FeeLine({ fee, approved, sample }: { fee: number | null; approved: boolean; sample: boolean }) {
  if (fee === null || (!approved && !sample && fee > 0)) return <span>Fee published soon</span>;
  if (fee === 0) return <span>Free</span>;
  return (
    <span>
      {inr(fee)} <span className="text-xs font-normal text-muted">incl. GST</span>
      {sample && <span className="ml-2 rounded bg-[#FEEBD0] px-1.5 py-0.5 text-[0.7rem] font-semibold text-[#6B3F00]">Sample fee</span>}
    </span>
  );
}
