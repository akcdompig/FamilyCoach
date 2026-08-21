import { DISCLAIMER } from "@/lib/ai/safety";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={className ?? "px-1 text-xs leading-relaxed text-muted"}>{DISCLAIMER}</p>
  );
}
