/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        surface: '#1f2937', // gray-800
        background: '#111827', // gray-900
        border: '#374151', // gray-700
        'text-primary': '#f3f4f6', // gray-100
        'text-secondary': '#9ca3af', // gray-400
        success: '#22c55e', // green-500
        danger: '#ef4444', // red-500
        'ai-accent': '#a855f7', // purple-500
      },
    },
  },
  plugins: [],
}