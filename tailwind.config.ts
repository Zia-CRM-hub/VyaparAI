import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#7c2d5b", dark: "#5e2045", light: "#f6e9f0" },
      },
    },
  },
  plugins: [],
};

export default config;
