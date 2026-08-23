"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** "Vandaag" is opgegaan in de bredere Plan-ervaring (dag/week/maand). Deze route
 *  blijft bestaan als dunne alias zodat oude links niet breken. */
export default function VandaagRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kind/plan?tab=dag");
  }, [router]);
  return null;
}
