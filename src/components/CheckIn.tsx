"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { Mood } from "@/lib/types";
import { MOOD_EMOJI, MOOD_LABEL, cx } from "@/lib/utils";

const OPTIONS: Mood[] = ["good", "ok", "low"];

interface Props {
  value?: Mood;
  question?: string;
  onSelect: (mood: Mood, note?: string) => void;
  allowNote?: boolean;
}

export function CheckIn({ value, question = "Hoe voel je je vandaag?", onSelect, allowNote = true }: Props) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  return (
    <Card>
      <p className="text-base font-medium text-ink">{question}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((mood) => {
          const active = value === mood;
          return (
            <button
              key={mood}
              type="button"
              onClick={() => {
                onSelect(mood, note || undefined);
                if (mood === "low" && allowNote) setShowNote(true);
              }}
              aria-pressed={active}
              className={cx(
                "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "border-primary bg-sage text-primary-dark shadow-soft"
                  : "border-line bg-surface text-muted hover:border-sage-dark hover:bg-sage-light",
              )}
            >
              <span className="text-2xl">{MOOD_EMOJI[mood]}</span>
              <span className="text-[13px] font-medium">{MOOD_LABEL[mood]}</span>
            </button>
          );
        })}
      </div>

      {allowNote && (showNote || value === "low") ? (
        <div className="mt-4 animate-fade-up">
          <label htmlFor="checkin-note" className="text-sm text-muted">
            Wil je er iets bij zetten? Hoeft niet.
          </label>
          <textarea
            id="checkin-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => value && onSelect(value, note || undefined)}
            rows={2}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition focus:border-primary/40 focus:bg-surface"
            placeholder="Bijvoorbeeld: het was druk op school."
          />
        </div>
      ) : null}
    </Card>
  );
}
