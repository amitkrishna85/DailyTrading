/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        card: '#0f172a',
        border: '#1e293b',
        muted: '#334155',
        primary: '#38bdf8',
        profit: '#10b981',
        loss: '#ef4444',
        warn: '#f59e0b',
      }
    },
  },
  plugins: [],
}

