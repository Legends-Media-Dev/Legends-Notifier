/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#18181b',
          light: '#27272a',
          muted: '#3f3f46',
          border: '#2e2e32',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          light: '#ede9fe',
          muted: '#a78bfa',
        },
        surface: {
          DEFAULT: '#fafafa',
          card: '#ffffff',
          muted: '#f4f4f5',
        },
        // legacy alias — maps to accent violet
        'apple-blue': '#7c3aed',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
