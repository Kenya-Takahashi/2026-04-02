import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
        serif: ['"Noto Serif JP"', "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
