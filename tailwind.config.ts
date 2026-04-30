import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b1120",
          panel: "#111827",
          subtle: "#1f2937",
        },
        border: {
          DEFAULT: "#1f2937",
          strong: "#374151",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        ok: "#10b981",
        warn: "#f59e0b",
        err: "#ef4444",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
