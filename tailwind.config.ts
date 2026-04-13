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
        // Superficies (jerarquía de fondos)
        "surface":                  "#f8f9fa",
        "surface-bright":           "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low":    "#f3f4f5",
        "surface-container":        "#edeeef",
        "surface-container-high":   "#e7e8e9",
        "surface-variant":          "#e1e3e4",

        // Primary (Anáhuac Orange)
        "primary":                  "#a04100",
        "primary-container":        "#ff6b00",
        "on-primary":               "#ffffff",
        "on-primary-container":     "#572000",

        // Secondary (Anthracite)
        "secondary":                "#5f5e5e",
        "secondary-container":      "#e2dfde",
        "on-secondary":             "#ffffff",
        "on-secondary-container":   "#636262",

        // Tertiary (Institutional Blue)
        "tertiary":                 "#0062a1",
        "tertiary-fixed":           "#d0e4ff",
        "on-tertiary-fixed":        "#001d35",

        // Error
        "error":                    "#ba1a1a",
        "error-container":          "#ffdad6",
        "on-error-container":       "#93000a",

        // Texto y bordes
        "on-surface":               "#191c1d",
        "on-surface-variant":       "#5a4136",
        "outline-variant":          "#e2bfb0",
        "background":               "#f8f9fa",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "sans-serif"],
        body:     ["var(--font-inter)", "sans-serif"],
        label:    ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm:  "0.25rem",
        md:  "0.375rem",
        lg:  "0.5rem",
        xl:  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        "card":  "0 4px 32px rgba(25,28,29,0.06)",
        "card-hover": "0 8px 40px rgba(25,28,29,0.10)",
        "fab":   "0 4px 24px rgba(255,107,0,0.35)",
        "btn-primary": "0 4px 16px rgba(255,107,0,0.30)",
      },
    },
  },
  plugins: [],
};
export default config;
