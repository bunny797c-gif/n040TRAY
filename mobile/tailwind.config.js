/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#2D5A3D",
          light: "#3A7050",
        },
        sage: {
          DEFAULT: "#8FB996",
          light: "#A8D4AE",
        },
        natural: {
          bg: "#F8FAF5",
          surface: "#EEF3E8",
          border: "#DCE8D4",
          mint: "#F5FAF5",
        },
        warm: {
          cream: "#FAF3ED",
          sand: "#EDE0D2",
        },
        coral: {
          DEFAULT: "#D97757",
          light: "#FDE8DA",
        },
        ink: {
          DEFAULT: "#2D3A28",
          muted: "#7A8A72",
          soft: "#5C7A52",
        },
      },
    },
  },
  plugins: [],
};
