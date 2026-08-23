import { Icon } from "@/components/Icons";
import { cx, starsFor } from "@/lib/utils";

interface Props {
  percentage: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/** Vijf sterren afgeleid uit een samengevoegd percentage — geen losse opgeslagen score. */
export function StarRating({ percentage, size = "md", className }: Props) {
  const stars = starsFor(percentage);
  return (
    <div className={cx("flex items-center gap-1", className)} role="img" aria-label={`${stars} van 5 sterren`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          filled={i < stars}
          className={cx(SIZES[size], i < stars ? "text-star" : "text-star-muted")}
        />
      ))}
    </div>
  );
}
