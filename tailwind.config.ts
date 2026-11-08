import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "Hind Siliguri", "system-ui", "sans-serif"] },
      colors: {
        ink: { DEFAULT: "#0f172a", soft: "#334155", mute: "#64748b" },
        brand: { DEFAULT: "#e8553d", dark: "#c9432d", tint: "#fdeee9" },
      },
    },
  },
  plugins: [],
} satisfies Config;
