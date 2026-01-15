/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        connection: {
          1: '#ef4444', // red
          2: '#f59e0b', // amber
          3: '#10b981', // emerald
          4: '#3b82f6', // blue
          5: '#8b5cf6', // violet
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    },
  },
  plugins: [],
}
