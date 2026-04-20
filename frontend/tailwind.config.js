/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#09111f",
        panel: "#0f1a2f",
        ink: "#e6eef8",
        accent: "#52c7b8",
        glow: "#ff8f6f"
      },
      boxShadow: {
        card: "0 20px 60px -20px rgba(0, 0, 0, 0.55)",
        neon: "0 0 0 1px rgba(82, 199, 184, 0.35), 0 20px 40px rgba(10, 36, 70, 0.45)"
      },
      animation: {
        "rise-in": "rise-in 500ms var(--ease-out) both",
        "fade-slide": "fade-slide 350ms var(--ease-out) both"
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: 0, transform: "translateY(20px) scale(0.97)" },
          "100%": { opacity: 1, transform: "translateY(0px) scale(1)" }
        },
        "fade-slide": {
          "0%": { opacity: 0, transform: "translateX(16px)" },
          "100%": { opacity: 1, transform: "translateX(0px)" }
        }
      }
    }
  },
  plugins: []
};
