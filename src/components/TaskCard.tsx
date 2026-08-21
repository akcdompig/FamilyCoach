"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Task } from "@/lib/types";
import { CATEGORY_ICON, CATEGORY_LABEL, cx } from "@/lib/utils";

interface Props {
  task: Task;
  done: boolean;
  onToggle: () => void;
  highlight?: boolean;
  readOnly?: boolean;
}

export function TaskCard({ task, done, onToggle, highlight, readOnly }: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current) {
      setJustCompleted(true);
      const timeout = setTimeout(() => setJustCompleted(false), 850);
      prevDone.current = done;
      return () => clearTimeout(timeout);
    }
    prevDone.current = done;
  }, [done]);

  return (
    <motion.div
      layout
      className={cx(
        "group relative flex items-center gap-3 overflow-visible rounded-2xl border bg-surface px-4 py-3.5 transition-colors",
        done ? "border-sage bg-sage-light/60" : "border-line hover:border-sage-dark hover:shadow-soft",
        highlight && !done && "ring-1 ring-accent/60",
      )}
    >
      <AnimatePresence>
        {justCompleted ? (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -42 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="pointer-events-none absolute right-4 top-0 text-sm font-bold text-primary"
          >
            +{task.points}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onToggle}
        disabled={readOnly}
        aria-pressed={done}
        aria-label={done ? `${task.title} ongedaan maken` : `${task.title} afronden`}
        whileTap={{ scale: 0.82 }}
        animate={justCompleted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          done
            ? "border-primary bg-primary text-white"
            : "border-sage-dark bg-surface text-transparent hover:border-primary",
          readOnly && "cursor-default opacity-70",
        )}
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M5 10.5l3.2 3.2L15 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <div className="min-w-0 flex-1">
        <p className={cx("truncate text-[15px] font-medium", done ? "text-muted line-through" : "text-ink")}>
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          <span>
            {CATEGORY_ICON[task.category]} {CATEGORY_LABEL[task.category]}
          </span>
          {task.time ? <span>· {task.time}</span> : null}
        </p>
      </div>

      <Badge tone={done ? "green" : "muted"}>+{task.points}</Badge>
    </motion.div>
  );
}
