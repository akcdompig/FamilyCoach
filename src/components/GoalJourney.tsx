import type { Goal, GoalMilestone } from "@/lib/types";
import { cx } from "@/lib/utils";

interface Props {
  goal: Goal;
  progress: number;
  milestones: GoalMilestone[];
  achieved: boolean;
  className?: string;
}

const WIDTH = 600;
const HEIGHT = 92;
const PAD = 28;
const TRACK_Y = 46;
const USABLE = WIDTH - PAD * 2;

/** Een doel als afgelegde weg, niet als percentagebalk — mijlpalen zijn echte drempels uit de data, geen decoratie. */
export function GoalJourney({ goal, progress, milestones, achieved, className }: Props) {
  const ratio = goal.target > 0 ? Math.min(1, progress / goal.target) : 0;
  const fillX = PAD + USABLE * ratio;

  return (
    <figure className={cx("m-0", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Voortgang naar ${goal.title}: ${progress} van ${goal.target}${goal.unit ? ` ${goal.unit}` : ""}${achieved ? ", behaald" : ""}`}
        className="h-auto w-full"
      >
        <line x1={PAD} y1={TRACK_Y} x2={WIDTH - PAD} y2={TRACK_Y} stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-line" />
        <line
          x1={PAD}
          y1={TRACK_Y}
          x2={fillX}
          y2={TRACK_Y}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className={achieved ? "text-primary" : "text-progress"}
        />
        <circle cx={PAD} cy={TRACK_Y} r="4" className="fill-muted" />

        {milestones.map((m) => {
          const x = PAD + USABLE * Math.min(1, m.threshold / goal.target);
          const reached = progress >= m.threshold;
          return (
            <g key={m.id}>
              <circle
                cx={x}
                cy={TRACK_Y}
                r={reached ? 6 : 5}
                strokeWidth="2"
                className={reached ? "fill-progress stroke-progress" : "fill-surface stroke-line"}
              />
              <text
                x={x}
                y={TRACK_Y - 14}
                textAnchor="middle"
                className={cx("font-mono text-[10px]", reached ? "fill-ink font-semibold" : "fill-muted")}
              >
                {m.threshold}
              </text>
            </g>
          );
        })}

        <circle
          cx={WIDTH - PAD}
          cy={TRACK_Y}
          r="8"
          strokeWidth="2"
          className={achieved ? "fill-primary stroke-primary" : "fill-surface stroke-ink"}
        />
        {achieved ? (
          <path
            d={`M ${WIDTH - PAD - 4} ${TRACK_Y} l 2.5 3 l 5 -6`}
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        <text x={WIDTH - PAD} y={TRACK_Y + 20} textAnchor="middle" className="fill-muted font-mono text-[10px]">
          {goal.target}
          {goal.unit ? ` ${goal.unit}` : ""}
        </text>
      </svg>
    </figure>
  );
}
