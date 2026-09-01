import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18211b",
        paper: "#f7f8f3",
        matcha: {
          50: "#f3f8ec",
          100: "#e3efd5",
          200: "#c7dda9",
          300: "#a4c778",
          400: "#83ae52",
          500: "#649239",
          600: "#4c742b",
          700: "#3c5925",
          800: "#334823",
          900: "#2c3d20",
        },
        coral: "#ff6846",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(33, 51, 36, 0.09)",
        card: "0 10px 30px rgba(40, 55, 42, 0.07)",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "slide-up": "slideUp .55s cubic-bezier(.22,1,.36,1) both",
        "scan": "scan 2.2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.45", transform: "scale(.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(520%)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
