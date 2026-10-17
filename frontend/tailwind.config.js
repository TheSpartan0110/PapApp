/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8ee",
          100: "#f9eece",
          200: "#f3dba0",
          300: "#ecc26e",
          400: "#e6aa45",
          500: "#d98d24",
          600: "#bb6d1b",
          700: "#944e19",
          800: "#793f1b",
          900: "#65351a",
        },
      },
    },
  },
  plugins: [],
};
