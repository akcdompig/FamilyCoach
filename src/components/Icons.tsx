import { cx } from "@/lib/utils";

export type IconName = "home" | "sun" | "heart" | "target" | "user" | "users" | "list" | "spark" | "bell" | "check" | "shield";

const PATHS: Record<IconName, string> = {
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z",
  sun: "M12 6v-2M12 20v-2M6 12H4M20 12h-2M7.5 7.5 6 6M18 18l-1.5-1.5M16.5 7.5 18 6M6 18l1.5-1.5M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z",
  heart: "M12 19s-6.5-4.2-6.5-8.4A3.6 3.6 0 0 1 12 8.2a3.6 3.6 0 0 1 6.5 2.4C18.5 14.8 12 19 12 19z",
  target: "M12 4v3M12 17v3M4 12h3M17 12h3M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z",
  user: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.5 20a6.5 6.5 0 0 1 13 0",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20a5.5 5.5 0 0 1 11 0M16 11.5a2.5 2.5 0 1 0 0-5M17 20a5.5 5.5 0 0 0-2-4.3",
  list: "M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01",
  spark: "M12 4l1.8 4.6L18.5 10l-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4z",
  bell: "M12 4.5a2 2 0 0 0-2 2v.6C7.6 7.7 6 9.9 6 12.5V16l-1.5 2h15L18 16v-3.5c0-2.6-1.6-4.8-4-5.4v-.6a2 2 0 0 0-2-2zM10 19a2 2 0 0 0 4 0",
  check: "M5 12.5l4.5 4.5L19 7",
  shield: "M12 4l7 2.6v5.4c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6.6z M9.5 12.3l1.8 1.8 3.4-3.6",
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("h-5 w-5", className)}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
