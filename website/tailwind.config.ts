import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05070d",
        panel: "#0a1020",
        accent: "#4ade80"
      }
    }
  },
  plugins: []
};

export default config;
