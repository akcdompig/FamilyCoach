"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Wellness verhuisde naar een tab op /kind/doelen ("Groei"). Deze route blijft
 *  bestaan als dunne alias zodat oude links (o.a. eventuele pushmeldingen) niet breken. */
export default function WellnessRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kind/doelen?tab=wellness");
  }, [router]);
  return null;
}
