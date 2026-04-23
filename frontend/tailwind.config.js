/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFCF8",
          100: "#FAFAF5",
          200: "#F5F0E8",
          300: "#EDE5D8",
          400: "#DDD0BC",
          500: "#C8B99A",
        },
        navy: {
          50: "#F0F4F8",
          100: "#D9E2ED",
          200: "#B0C4D8",
          300: "#7A9BBF",
          400: "#4A72A0",
          500: "#2D5282",
          600: "#1B3A62",
          700: "#112944",
          800: "#0D1F35",
          900: "#091629",
          950: "#060E18",
        },
        gold: {
          50: "#FDF8EC",
          100: "#FAEDD0",
          200: "#F5D99E",
          300: "#EEC060",
          400: "#E3A32E",
          500: "#C8891C",
          600: "#A86D15",
          700: "#875412",
          800: "#6C4212",
          900: "#593612",
        },
        sage: {
          50: "#F0F7F3",
          100: "#DAEEE4",
          200: "#B5DDCA",
          300: "#7EC4A7",
          400: "#43A67F",
          500: "#208861",
          600: "#166B4D",
          700: "#12553D",
          800: "#104432",
          900: "#0E392B",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        body: ["Sora", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(9,22,41,0.05), 0 4px 12px rgba(9,22,41,0.06)",
        "card-lg":
          "0 4px 6px rgba(9,22,41,0.04), 0 12px 28px rgba(9,22,41,0.09)",
        "card-xl":
          "0 8px 16px rgba(9,22,41,0.05), 0 24px 48px rgba(9,22,41,0.12)",
        gold: "0 4px 16px rgba(200,137,28,0.22)",
        navy: "0 4px 16px rgba(9,22,41,0.22)",
        glow: "0 0 0 3px rgba(200,137,28,0.15)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.25rem", "4xl": "1.5rem" },
    },
  },
  plugins: [],
};
