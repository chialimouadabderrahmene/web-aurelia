import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        sand: "#F8F6F2",
        gold: "#B8935F",
        "gold-soft": "#D9C4A3",
        cream: "#FBF9F6",
        line: "#E7E2D9",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        xl2: "20px",
        xl3: "24px",
      },
      boxShadow: {
        soft: "0 2px 24px -8px rgba(17,17,17,0.08)",
        card: "0 8px 30px -12px rgba(17,17,17,0.10)",
        lift: "0 20px 60px -20px rgba(17,17,17,0.18)",
      },
      letterSpacing: {
        widest2: "0.18em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      maxWidth: {
        "screen-2xl": "1440px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "fade-up": "fade-up 0.8s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
