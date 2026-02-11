import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#0066FF", foreground: "#FFFFFF" },
            secondary: { DEFAULT: "#7C3AED", foreground: "#FFFFFF" },
            success: { DEFAULT: "#10B981", foreground: "#FFFFFF" },
            warning: { DEFAULT: "#F59E0B", foreground: "#000000" },
            danger: { DEFAULT: "#EF4444", foreground: "#FFFFFF" },
          },
        },
        dark: {
          colors: {
            primary: { DEFAULT: "#3B82F6", foreground: "#FFFFFF" },
            secondary: { DEFAULT: "#8B5CF6", foreground: "#FFFFFF" },
            success: { DEFAULT: "#34D399", foreground: "#000000" },
            warning: { DEFAULT: "#FBBF24", foreground: "#000000" },
            danger: { DEFAULT: "#F87171", foreground: "#000000" },
          },
        },
      },
    }),
  ],
};

export default config;
