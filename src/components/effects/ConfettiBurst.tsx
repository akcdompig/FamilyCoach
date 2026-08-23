"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#2F6B52", "#E2582E", "#1F6F63", "#F2946A", "#56917A", "#DCEAE1"];
const PIECES = 26;

/**
 * Eenmalige confetti-burst, bedoeld voor het kind-gedeelte van de app
 * (release 4: "ook voor jongeren fijn om te gebruiken"). Vuurt af zodra
 * `trigger` verandert (bv. via een oplopende counter) — geen eigen state
 * nodig bij de aanroeper buiten die counter.
 */
export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 100 + Math.random() * 170;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.75 - 70;
        return (
          <motion.span
            key={`${trigger}-${i}`}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: 0, x, y, scale: 1, rotate: (Math.random() - 0.5) * 520 }}
            transition={{ duration: 1 + Math.random() * 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: "50%",
              top: "32%",
              width: 7,
              height: 10,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
            }}
          />
        );
      })}
    </div>
  );
}

/** Simpele hook: `fire()` aanroepen verhoogt de trigger-counter voor ConfettiBurst. */
export function useConfetti() {
  const [trigger, setTrigger] = useState(0);
  return { trigger, fire: () => setTrigger((t) => t + 1) };
}
