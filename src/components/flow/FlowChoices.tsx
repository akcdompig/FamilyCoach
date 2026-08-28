"use client";

import { motion } from "framer-motion";
import type { ConversationChoice } from "@/lib/types";
import { cx } from "@/lib/utils";

/** Grote antwoordknoppen (release 3 §2) — bewust groot, nooit een kale lijst links. */
export function FlowChoices({
  choices,
  onSelect,
  disabled,
  emphasize,
}: {
  choices: ConversationChoice[];
  onSelect: (id: string, label: string) => void;
  disabled?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={cx("grid gap-2", choices.length > 2 ? "grid-cols-2" : "grid-cols-1")}>
      {choices.map((choice, index) => (
        <motion.button
          key={choice.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(choice.id, choice.label)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, type: "spring", stiffness: 340, damping: 24 }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
          whileHover={disabled ? undefined : { y: -1 }}
          className={cx(
            "rounded-2xl border px-4 py-3 text-left text-[15px] font-medium leading-snug transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            emphasize
              ? "border-primary bg-primary text-white shadow-soft hover:bg-primary-dark"
              : "border-line bg-surface text-ink hover:border-sage-dark hover:bg-sage-light",
          )}
        >
          {choice.label}
        </motion.button>
      ))}
    </div>
  );
}

export function ProgressDots({ index, total }: { index: number; total: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1.5" aria-label={`Stap ${index + 1} van ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          className="h-1.5 rounded-full bg-sage-dark/50"
          animate={{ width: i <= index ? 16 : 6, backgroundColor: i <= index ? "#0F7A3D" : "rgba(35,20,51,0.16)" }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        />
      ))}
    </div>
  );
}
