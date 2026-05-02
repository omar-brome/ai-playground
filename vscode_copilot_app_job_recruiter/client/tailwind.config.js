/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        'primary-hover': '#5855EB',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        'bg-primary': '#0F0F1A',
        'bg-secondary': '#1A1A2E',
        'bg-tertiary': '#242449',
        'bg-card': '#1E1E3F',
        'bg-hover': '#2A2A5E',
        'text-primary': '#F8FAFC',
        'text-secondary': '#CBD5E1',
        'text-muted': '#94A3B8',
        border: '#334155',
        'border-light': '#475569',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4',
      },
    },
  },
  plugins: [],
}

