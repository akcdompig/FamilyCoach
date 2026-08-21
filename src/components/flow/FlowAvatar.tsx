"use client";

import { motion, type Transition } from "framer-motion";
import type { FlowAvatarState } from "@/lib/types";
import { cx } from "@/lib/utils";

/**
 * Flow's character (release 3 §1, §22; release 4: levendiger voor een
 * jong/tiener-publiek). Bewust geen realistische mascotte: een zachte,
 * ronde vorm met simpele oogjes/mond die per state verandert — nu met
 * echte, veerkrachtige beweging in plaats van alleen CSS-keyframes.
 */

interface Props {
  state?: FlowAvatarState;
  size?: number;
  className?: string;
}

const BODY_TONE: Record<FlowAvatarState, [string, string]> = {
  idle: ["#DDEBE3", "#4C7A65"],
  thinking: ["#EEF5F1", "#4C7A65"],
  listening: ["#DDEBE3", "#315C4A"],
  happy: ["#F7EAD1", "#C2913F"],
  celebrating: ["#F7EAD1", "#C2913F"],
  concerned: ["#F6F1E9", "#8A7B5C"],
  coaching: ["#DDEBE3", "#315C4A"],
};

const BOUNCY: Transition = { type: "spring", stiffness: 260, damping: 14 };

const BODY_MOTION: Record<FlowAvatarState, { animate: Record<string, number[] | number>; transition: Transition }> = {
  idle: { animate: { scale: [1, 1.035, 1] }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } },
  thinking: { animate: { scale: [1, 1.08, 1] }, transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" } },
  listening: { animate: { scale: [1, 1.05, 1] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  happy: { animate: { rotate: [0, -5, 5, 0], scale: [1, 1.06, 1] }, transition: { duration: 0.55, ease: "easeInOut" } },
  celebrating: {
    animate: { y: [0, -9, 0, -5, 0], rotate: [0, -7, 7, -4, 0], scale: [1, 1.08, 1.02, 1.08, 1] },
    transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.25, ease: "easeInOut" },
  },
  concerned: { animate: { scale: 1 }, transition: BOUNCY },
  coaching: { animate: { scale: [1, 1.02, 1] }, transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } },
};

function Mouth({ state }: { state: FlowAvatarState }) {
  switch (state) {
    case "happy":
    case "celebrating":
      return <path d="M22 30q6 6 12 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
    case "concerned":
      return <path d="M22 32q6 -5 12 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
    case "thinking":
      return <circle cx="27" cy="30" r="2.2" fill="currentColor" />;
    case "listening":
      return <ellipse cx="27" cy="30" rx="3.5" ry="2.6" fill="currentColor" opacity="0.85" />;
    case "coaching":
      return <path d="M21 29.5q6 4 12 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
    default:
      return <path d="M22 30q5 3 10 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  }
}

export function FlowAvatar({ state = "idle", size = 56, className }: Props) {
  const [bg, fg] = BODY_TONE[state];
  const body = BODY_MOTION[state];
  const eyeScale = state === "celebrating" || state === "happy" ? 1.15 : 1;

  return (
    <motion.span
      className={cx("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={BOUNCY}
      aria-hidden
    >
      <motion.span
        className="absolute inset-0 rounded-[46%_54%_52%_48%/48%_46%_54%_52%]"
        style={{ backgroundColor: bg }}
        animate={body.animate}
        transition={body.transition}
      />
      <svg viewBox="0 0 54 54" width={size} height={size} className="relative" style={{ color: fg }}>
        <motion.ellipse
          cx="19"
          cy="23"
          rx="2.6"
          ry="3.2"
          fill="currentColor"
          animate={{ scaleY: [1, 1, 0.1, 1, 1], scale: eyeScale }}
          transition={{ scaleY: { duration: 4.5, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }, scale: BOUNCY }}
          style={{ originX: "0.5", originY: "0.5" }}
        />
        <motion.ellipse
          cx="35"
          cy="23"
          rx="2.6"
          ry="3.2"
          fill="currentColor"
          animate={{ scaleY: [1, 1, 0.1, 1, 1], scale: eyeScale }}
          transition={{ scaleY: { duration: 4.5, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }, scale: BOUNCY }}
          style={{ originX: "0.5", originY: "0.5" }}
        />
        {state === "concerned" ? (
          <>
            <path d="M15 17.5q4 -2.5 7 -0.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M32 17q3 -2 7 0.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </>
        ) : null}
        {state === "thinking" ? (
          <>
            <motion.circle
              cx="42"
              cy="12"
              r="1.6"
              fill="currentColor"
              opacity="0.5"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="46"
              cy="7"
              r="2.2"
              fill="currentColor"
              opacity="0.7"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </>
        ) : null}
        {state === "celebrating" ? (
          <>
            <motion.path
              d="M6 10l1.6 3.6L11 15l-3.4 1.4L6 20l-1.6-3.6L1 15l3.4-1.4z"
              fill="currentColor"
              animate={{ opacity: [0.3, 0.8, 0.3], rotate: [0, 25, 0], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "6px", originY: "15px" }}
            />
            <motion.path
              d="M46 6l1.2 2.7L50 10l-2.8 1.1L46 14l-1.2-2.9L42 10l2.8-1.3z"
              fill="currentColor"
              animate={{ opacity: [0.8, 0.3, 0.8], rotate: [0, -25, 0], scale: [1.1, 0.85, 1.1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              style={{ originX: "46px", originY: "10px" }}
            />
          </>
        ) : null}
        <g transform="translate(0,29)">
          <Mouth state={state} />
        </g>
      </svg>
    </motion.span>
  );
}

export const AVATAR_STATE_LABEL: Record<FlowAvatarState, string> = {
  idle: "Flow is er voor je",
  thinking: "Flow denkt na...",
  listening: "Flow luistert",
  happy: "Flow is blij",
  celebrating: "Flow viert mee",
  concerned: "Flow maakt zich zorgen",
  coaching: "Flow denkt met je mee",
};
