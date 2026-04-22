import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        bg: "#0b0d12",
        surface: "#11151c",
        surfaceRaised: "#181c26",
        border: "#232836",
        text: "#e6e8ef",
        textMuted: "#9aa3b4",
        accent: "#7c5cff",
        accentSoft: "rgba(124, 92, 255, 0.15)",
        success: "#3ecf8e",
        warning: "#f5a524",
        danger: "#f31260",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
    },
  },
  plugins: [],
};

export default config;
