import { cx } from "@/lib/utils";

interface Props {
  value: number;
  max?: number;
  label?: string;
  tone?: "primary" | "accent" | "progress";
  className?: string;
}

const BAR_TONE: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  progress: "bg-progress",
};

export function Progress({ value, max = 100, label, tone = "primary", className }: Props) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={className}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-sage"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Voortgang"}
      >
        <div
          className={cx("h-full rounded-full transition-[width] duration-700 ease-out", BAR_TONE[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

const RING_TONE: Record<"primary" | "progress", { track: string; fill: string }> = {
  primary: { track: "#DCEAE1", fill: "#2F6B52" },
  progress: { track: "#E1EFEA", fill: "#1F6F63" },
};

export function Ring({
  value,
  max,
  size = 56,
  tone = "primary",
}: {
  value: number;
  max: number;
  size?: number;
  tone?: "primary" | "progress";
}) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = RING_TONE[tone];

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.fill}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}
