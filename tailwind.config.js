/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          DEFAULT: "#229ED9",
          hover: "#1E88E5",
          light: "#E3F2FD",
        },
      },
    },
  },
  plugins: [],
};
