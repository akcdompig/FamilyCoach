import { cx } from "@/lib/utils";

/**
 * Het gezicht van de coach: geen mascotte, maar een rustig ademend punt.
 * Bewuste keuze - het moet aanwezig zijn zonder aandacht op te eisen.
 */
export function FlowMark({ size = 40, calm = false }: { size?: number; calm?: boolean }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className={cx(
          "absolute inset-0 rounded-full bg-sage",
          !calm && "animate-breathe motion-reduce:animate-none",
        )}
      />
      <span
        className="absolute rounded-full bg-primary"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
    </span>
  );
}
