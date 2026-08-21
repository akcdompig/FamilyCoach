"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Ring } from "@/components/ui/Progress";
import type { Mood, Person } from "@/lib/types";
import { MOOD_EMOJI, MOOD_LABEL, cx } from "@/lib/utils";

interface Props {
  person: Person;
  done: number;
  total: number;
  mood?: Mood;
  points?: number;
  href?: string;
}

export function FamilyMemberCard({ person, done, total, mood, points, href }: Props) {
  const complete = total > 0 && done === total;
  const content = (
    <div
      className={cx(
        "flex items-center gap-4 rounded-3xl border border-line/80 bg-surface p-4 transition",
        href && "hover:border-sage-dark hover:shadow-soft",
      )}
    >
      <div className="relative flex items-center justify-center">
        <Ring value={done} max={Math.max(total, 1)} size={56} />
        <Avatar
          name={person.name}
          color={person.color}
          size="sm"
          className="absolute"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">
          {person.name}
          {person.age ? <span className="ml-2 text-sm font-normal text-muted">{person.age}</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {total === 0 ? "Geen afspraken vandaag" : `${done}/${total} afspraken`}
          {complete ? " · rond" : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          {mood ? `${MOOD_EMOJI[mood]} ${MOOD_LABEL[mood]}` : "Nog geen check-in"}
          {typeof points === "number" ? ` · ${points} punten` : ""}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl">
      {content}
    </Link>
  ) : (
    content
  );
}
