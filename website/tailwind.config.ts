import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        panel: "#0a0a0a",
        border: "#262626",
        accent: {
          DEFAULT: "#4ade80",
          glow: "rgba(74, 222, 128, 0.4)",
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};

export default config;
