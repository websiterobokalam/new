"use client";
import { useRouter } from "next/navigation";
import { ConsentForm } from "./ConsentForm";
import type { Notice } from "@/lib/learn/consent";

export function AddLearner({ notice }: { notice: Notice }) {
  const router = useRouter();
  return <ConsentForm notice={notice} onDone={(id) => { router.push(`/app/learners/${id}`); }} />;
}
