"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** "Login" for visitors, "Family home" for signed-in parents. Server HTML always says Login. */
export function AccountLink() {
  const [inside, setInside] = useState(false);
  useEffect(() => setInside(/(?:^|; )rk_in=1/.test(document.cookie)), []);
  return (
    <Link href={inside ? "/app" : "/login"} className="btn btn-primary !min-h-10 !px-4 !py-2 whitespace-nowrap text-sm" aria-label={inside ? "Family home" : "Login"}>
      {inside ? <><span className="sm:hidden">Home</span><span className="hidden sm:inline">Family home</span></> : "Login"}
    </Link>
  );
}
