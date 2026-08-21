import { cx } from "@/lib/utils";

interface Props {
  value: number;
  max?: number;
  label?: string;
  tone?: "primary" | "accent";
  className?: string;
}

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
          className={cx(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            tone === "primary" ? "bg-primary" : "bg-accent",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Ring({ value, max, size = 56 }: { value: number; max: number; size?: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#DDEBE3" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#315C4A"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}
