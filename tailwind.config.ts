import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      custom: "820px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1600px",
    },
    extend: {
      colors: {
        background: "#000000",
        cream: {
          DEFAULT: "#f5efe2",
          dark: "#151510",
          muted: "rgba(245, 239, 226, 0.75)",
          subtle: "rgba(245, 239, 226, 0.4)",
          faint: "rgba(245, 239, 226, 0.15)",
        },
      },
      fontFamily: {
        antonio: ["Antonio", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
      },
      animation: {
        "pulse-dot": "pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.25", transform: "scale(0.85)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
