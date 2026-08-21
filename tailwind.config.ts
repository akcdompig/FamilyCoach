import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F7F3",
        surface: "#FFFFFF",
        ink: "#1D2923",
        muted: "#6E7973",
        line: "#E7E9E3",
        primary: {
          DEFAULT: "#315C4A",
          dark: "#24463A",
          light: "#4C7A65",
        },
        sage: {
          DEFAULT: "#DDEBE3",
          light: "#EEF5F1",
          dark: "#C6DCD0",
        },
        sand: {
          DEFAULT: "#EFE7DA",
          light: "#F6F1E9",
        },
        accent: {
          DEFAULT: "#E5B96A",
          soft: "#F7EAD1",
          dark: "#C2913F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(29,41,35,0.04), 0 10px 30px -18px rgba(29,41,35,0.25)",
        lift: "0 2px 6px rgba(29,41,35,0.05), 0 20px 44px -20px rgba(29,41,35,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.06)", opacity: "0.85" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(0)" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-28px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-5px) rotate(-3deg)" },
          "75%": { transform: "translateY(-2px) rotate(3deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.32s cubic-bezier(0.22,1,0.36,1) both",
        breathe: "breathe 5.5s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        rise: "rise 1.1s ease-out forwards",
        bob: "bob 0.9s ease-in-out infinite",
        "pulse-soft": "pulse-soft 0.8s ease-in-out infinite",
        blink: "blink 4.5s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
