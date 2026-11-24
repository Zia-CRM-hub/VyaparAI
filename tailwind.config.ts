import type { Config } from "tailwindcss";

// `--brand` is set per tenant on the app shell (Settings > Branding), so every screen re-themes itself.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          dark: "color-mix(in srgb, var(--brand) 78%, black)",
          light: "color-mix(in srgb, var(--brand) 10%, white)",
          mid: "color-mix(in srgb, var(--brand) 25%, white)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
