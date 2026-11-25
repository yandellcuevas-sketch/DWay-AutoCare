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
        dway: {
          red: "#F50923",
          "red-dark": "#CC071D",
          graphite: "#1E2127",
          "graphite-dark": "#15171B",
          white: "#FAFAFA",
          gray: "#424750",
          "gray-light": "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
