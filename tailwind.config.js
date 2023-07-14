/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: 'Inter, sans-serif',
        grad: '"grad", serif',
      },
      colors: {
        "sand": "#FFFDED",
        "blue": "#373EE8",
        "dark": "#2D3230",
        "orange": "#F17A4C",
        "light-orange": "#FADBCF80",
        "purple": "#6060D3",
        "peach": "#F6B79D",
        "yellow": "#F8D66E",
        "light-pink": "#F7C6EC",
        "green": "#769883",
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    },
  ],
}