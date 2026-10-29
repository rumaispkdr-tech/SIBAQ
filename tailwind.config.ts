import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Samsung One UI × Sage & Cream Official Palette
        oneui: {
          cream: "#FAF9F6",   // Warm cream
          sage: "#A3B18A",    // Soft sage
          forest: "#344E41",  // Forest green
          lime: "#E9EDC9",    // Pale lime
          white: "#FFFFFF",   // White
          surface: "#F0F1E9", // Muted surface
        },
        emerald: {
          50: "#FAF9F6",
          100: "#E9EDC9", // Pale lime
          200: "#D4DEBF",
          300: "#B8C9A3",
          400: "#A3B18A", // Soft sage
          500: "#486B56",
          600: "#3D5B49",
          700: "#344E41", // Forest green
          800: "#283C32",
          900: "#1E2C25",
          950: "#131C17",
        },
        sage: {
          light: "#F0F3E8",
          DEFAULT: "#A3B18A", // Soft sage
          dark: "#7F8E66",
        },
        cream: {
          DEFAULT: "#FAF9F6", // Warm cream
          dark: "#F0F1E9",
        },
        lime: {
          DEFAULT: "#E9EDC9", // Pale lime
          dark: "#D5DDB0",
        },
        forest: {
          DEFAULT: "#344E41", // Forest green
          dark: "#25372E",
        },
        ivory: {
          DEFAULT: "#FAF9F6",
          card: "#FFFFFF",
          muted: "#F0F1E9",
        },
        gold: {
          light: "#F5ECD0",
          DEFAULT: "#D8B56D",
          dark: "#B39045",
        },
        misty: {
          DEFAULT: "#E6ECE8",
          dark: "#A3B18A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        arabic: ["Amiri", "Scheherazade New", "Traditional Arabic", "Noto Naskh Arabic", "Geeza Pro", "serif"],
      },
      borderRadius: {
        "oneui-sm": "14px",
        "oneui-md": "20px",
        "oneui-lg": "28px",
        "oneui-xl": "36px",
      },
      keyframes: {
        // Seamless Ambient Gradient Flow (18-30s cycle)
        ambientFlow: {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
        // Floating Organic Gradient Orbs (14-24s continuous smooth path loops)
        orbFloat1: {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          "33%": {
            transform: "translate3d(40px, -50px, 0) scale(1.08)",
          },
          "66%": {
            transform: "translate3d(-30px, 35px, 0) scale(0.95)",
          },
        },
        orbFloat2: {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          "33%": {
            transform: "translate3d(-45px, 40px, 0) scale(0.94)",
          },
          "66%": {
            transform: "translate3d(35px, -30px, 0) scale(1.06)",
          },
        },
        orbFloat3: {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          "50%": {
            transform: "translate3d(50px, 45px, 0) scale(1.1)",
          },
        },
        orbFloat4: {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          "50%": {
            transform: "translate3d(-35px, -45px, 0) scale(0.92)",
          },
        },
        // Soft floating particles drift
        particleDrift: {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px)",
            opacity: "0.35",
          },
          "50%": {
            transform: "translateY(-28px) translateX(12px)",
            opacity: "0.65",
          },
        },
        particleDriftSlow: {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px)",
            opacity: "0.25",
          },
          "50%": {
            transform: "translateY(-40px) translateX(-16px)",
            opacity: "0.55",
          },
        },
        // Hero Section Entrance (500-800ms)
        heroFadeRise: {
          "0%": {
            opacity: "0",
            transform: "translateY(24px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(3deg)" },
        },
        sadBob: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg) scale(1)" },
          "50%": { transform: "translateY(-12px) rotate(-2deg) scale(1.03)" },
        },
      },
      animation: {
        "ambient-flow": "ambientFlow 22s ease-in-out infinite",
        "orb-1": "orbFloat1 18s ease-in-out infinite",
        "orb-2": "orbFloat2 22s ease-in-out infinite",
        "orb-3": "orbFloat3 16s ease-in-out infinite",
        "orb-4": "orbFloat4 24s ease-in-out infinite",
        "particle-drift": "particleDrift 16s ease-in-out infinite",
        "particle-drift-slow": "particleDriftSlow 20s ease-in-out infinite",
        "hero-fade-rise": "heroFadeRise 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 6s ease-in-out infinite",
        sadBob: "sadBob 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
