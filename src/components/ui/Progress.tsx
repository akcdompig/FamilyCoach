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
  primary: { track: "#DCEFF0", fill: "#0E7C86" },
  progress: { track: "#DFF3F1", fill: "#1A8E85" },
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

/**
 * Twee-laags ring voor de navy hero-kaart: buiten = totale gezinsscore (grijs),
 * binnen = eigen bijdrage (helder teal). Alleen bedoeld voor gebruik op een
 * donkere ondergrond — niet op surface/paper kaarten.
 */
export function DualRing({
  individual,
  family,
  max,
  size = 128,
}: {
  individual: number;
  family: number;
  max: number;
  size?: number;
}) {
  const individualRatio = max > 0 ? Math.min(1, individual / max) : 0;
  const familyRatio = max > 0 ? Math.min(1, family / max) : 0;
  const stroke = 10;
  const gap = 6;
  const outerRadius = (size - stroke) / 2;
  const innerRadius = outerRadius - stroke - gap;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
      role="img"
      aria-label={`Jouw bijdrage: ${individual} van ${max}. Gezinsscore: ${family} van ${max}.`}
    >
      <circle cx={size / 2} cy={size / 2} r={outerRadius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={outerRadius}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={outerCircumference}
        strokeDashoffset={outerCircumference * (1 - familyRatio)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <circle cx={size / 2} cy={size / 2} r={innerRadius} fill="none" stroke="rgba(51,199,192,0.22)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={innerRadius}
        fill="none"
        stroke="#33C7C0"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={innerCircumference}
        strokeDashoffset={innerCircumference * (1 - individualRatio)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}
