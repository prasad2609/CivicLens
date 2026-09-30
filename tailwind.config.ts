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
        background: "var(--background)",
        foreground: "var(--foreground)",
        civic: {
          50: "#f0f6fe",
          100: "#dbe8fd",
          200: "#bfd7fc",
          300: "#93bffa",
          400: "#609df7",
          500: "#3b82f6",
          600: "#1d4ed8",
          700: "#1e3a8a",
          800: "#172554",
          900: "#0f172a",
          950: "#080d1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
