const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
       fontFamily: {
          sans: ['var(--font-modern-era)', ...defaultTheme.fontFamily.sans],
          mono: ['var(--font-dm-mono)', ...defaultTheme.fontFamily.mono],
        },
       colors: {
        transparent: "transparent",
        black: "#000",
        white: "#FFF",
        grey: {
          50: "#F3F3F5",
          100: "#EBEBEB",
          150: "#F3F3F5",
          200: "#C4C1CF",
          250: "#BEBEBE",
          300: "#A7A2B6",
          400: "#555", // "#757087",
          500: "#0E0333",
        },
        blue: {
          ...colors.blue,
          100: "#D3EDFE",
          200: "#15B8DC",
          300: "#5F94BC",
          800: "#15003E"
        },
        green: {
          ...colors.green,
          50: "#DCF5F2",
          100: "#ADEDE5",
          200: "#47A095",
          300: "rgba(0, 67, 59, 1)",
        },
        orange: {
          ...colors.orange,
          100: "#FFD9CD",
        },
        violet: {
          100: "#F0EBFF",
          200: "#C9B8FF",
          300: "#8C65F7",
          400: "#6F3FF5",
          500: "#5932C4",
        },
        teal: {
          100: "#E6FFF9",
          200: "#B3FFED",
          300: "#5BF1CD",
          400: "#02E2AC",
          500: "#11BC92",
        },
        pink: {
          100: "#FDDEE4",
          200: "#FAADBF",
          300: "#F579A6",
          400: "#F3587D",
          500: "#D03E63",
        },
        yellow: {
          100: "#FFF8DB",
          200: "#FFEEA8",
          300: "#FFDB4C",
          400: "#FFCC00",
          500: "#E1B815",
        },
        red: {
          100: "#D44D6E",
        },
        "gitcoin-violet": {
          100: "#F0EBFF",
          200: "#C9B8FF",
          300: "#8C65F7",
          400: "#6F3FF5",
          500: "#5932C4",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/line-clamp"),
    function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    },
  ],
}