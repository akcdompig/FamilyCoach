"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icons";
import type { Task } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL, cx } from "@/lib/utils";

interface Props {
  task: Task;
  done: boolean;
  onToggle: () => void;
  highlight?: boolean;
  readOnly?: boolean;
  priority?: "high" | "normal";
  moved?: boolean;
  overdue?: boolean;
  /** Aanwezigheid van deze drie props schakelt de "Replan, don't fail"-acties in. */
  onPostpone?: () => void;
  onSkip?: () => void;
  onTogglePriority?: () => void;
}

export function TaskCard({
  task,
  done,
  onToggle,
  highlight,
  readOnly,
  priority = "normal",
  moved,
  overdue,
  onPostpone,
  onSkip,
  onTogglePriority,
}: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const prevDone = useRef(done);
  const canReplan = !done && !readOnly && (onPostpone || onSkip || onTogglePriority);

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
        "overflow-visible rounded-2xl border bg-surface transition-colors",
        done ? "border-sage bg-sage-light/60" : "border-line hover:border-sage-dark hover:shadow-soft",
        highlight && !done && "ring-1 ring-accent/60",
        priority === "high" && !done && !highlight && "ring-1 ring-accent/40",
        overdue && !done && "border-l-4 border-l-danger",
      )}
    >
      <div className="group relative flex items-center gap-3 px-4 py-3.5">
        <AnimatePresence>
          {justCompleted ? (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.7 }}
              animate={{ opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0, y: -42 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="pointer-events-none absolute right-4 top-0 font-mono text-sm font-bold text-primary"
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
          <div className="flex items-center gap-1.5">
            {priority === "high" && !done ? (
              <Icon name="spark" className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
            ) : null}
            <p className={cx("truncate text-[15px] font-medium", done ? "text-muted line-through" : "text-ink")}>
              {task.title}
            </p>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className={cx("flex h-4 w-4 items-center justify-center rounded-full", CATEGORY_COLOR[task.category].bg)}>
                <Icon name={CATEGORY_ICON[task.category]} className={cx("h-2.5 w-2.5", CATEGORY_COLOR[task.category].text)} />
              </span>
              {CATEGORY_LABEL[task.category]}
            </span>
            {task.time ? <span className="font-mono tabular-nums">· {task.time}</span> : null}
            {overdue && !done ? <span className="font-medium text-danger">· te laat</span> : null}
            {moved ? <span className="text-primary">· verplaatst</span> : null}
          </p>
        </div>

        <Badge tone={done ? "green" : "muted"} className="font-mono tabular-nums">
          +{task.points}
        </Badge>

        {canReplan ? (
          <button
            type="button"
            aria-label="Meer opties voor deze afspraak"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-sage-light hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="chevron" className={cx("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {expanded && canReplan ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-4 py-3">
              {onPostpone ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onPostpone();
                    setExpanded(false);
                  }}
                >
                  Naar morgen
                </Button>
              ) : null}
              {onTogglePriority ? (
                <Button size="sm" variant={priority === "high" ? "soft" : "ghost"} onClick={onTogglePriority}>
                  {priority === "high" ? "Niet meer belangrijk" : "Dit is belangrijk"}
                </Button>
              ) : null}
              {onSkip ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onSkip();
                    setExpanded(false);
                  }}
                >
                  Overslaan voor vandaag
                </Button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
