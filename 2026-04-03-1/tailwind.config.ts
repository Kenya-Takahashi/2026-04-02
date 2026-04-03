import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        surface: "var(--bg-secondary)",
        muted: "var(--text-secondary)",
        border: "var(--border)",
        accent: "var(--accent-blue)",
      },
      boxShadow: {
        card: "0 12px 30px -18px rgba(27, 31, 35, 0.25)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
