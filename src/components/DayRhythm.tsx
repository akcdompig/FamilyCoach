"use client";

import type { Task } from "@/lib/types";
import { cx, minutesFromString, partOfDay } from "@/lib/utils";

interface Props {
  tasks: { task: Task; done: boolean }[];
  now?: Date;
}

const BLOCKS = [
  { key: "ochtend", label: "Ochtend", from: 0, to: 12 * 60 },
  { key: "middag", label: "Middag", from: 12 * 60, to: 18 * 60 },
  { key: "avond", label: "Avond", from: 18 * 60, to: 24 * 60 },
] as const;

/**
 * Het dagritme in plaats van een grafiek. Laat in één blik zien hoe de dag
 * loopt en waar het nu druk is - precies waar FamilyFlow over gaat.
 */
export function DayRhythm({ tasks, now = new Date() }: Props) {
  const current = partOfDay(now);

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Dagritme">
      {BLOCKS.map((block) => {
        const inBlock = tasks.filter(({ task }) => {
          const minutes = minutesFromString(task.time ?? "12:00");
          return minutes >= block.from && minutes < block.to;
        });
        const done = inBlock.filter((item) => item.done).length;
        const active = current === block.key;

        return (
          <div
            key={block.key}
            className={cx(
              "rounded-2xl border px-3 py-3 transition",
              active ? "border-primary/30 bg-surface shadow-soft" : "border-line/70 bg-surface/50",
            )}
          >
            <p
              className={cx(
                "text-[11px] font-semibold uppercase tracking-[0.12em]",
                active ? "text-primary" : "text-muted",
              )}
            >
              {block.label}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {inBlock.length === 0 ? (
                <span className="text-xs text-muted">vrij</span>
              ) : (
                inBlock.map(({ task, done: isTaskDone }) => (
                  <span
                    key={task.id}
                    title={task.title}
                    className={cx(
                      "h-2.5 w-2.5 rounded-full transition",
                      isTaskDone ? "bg-primary" : "bg-sage-dark",
                    )}
                  />
                ))
              )}
            </div>
            {inBlock.length > 0 ? (
              <p className="mt-2 text-xs text-muted">
                {done}/{inBlock.length}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
