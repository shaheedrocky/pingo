/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        primary: '#0A84FF',
        primaryDark: '#3B82F6',

        secondary: '#F3F4F6',
        secondaryDark: '#1E293B',

        background: '#FFFFFF',
        backgroundDark: '#0F172A',

        surface: '#F8FAFC',
        surfaceDark: '#1E293B',

        card: '#FFFFFF',
        cardDark: '#111827',

        text: '#111827',
        textDark: '#F8FAFC',

        'text-secondary': '#6B7280',
        'text-secondaryDark': '#94A3B8',

        border: '#E5E7EB',
        borderDark: '#334155',

        success: '#22C55E',
        successDark: '#22C55E',

        warning: '#F59E0B',
        warningDark: '#F59E0B',

        danger: '#EF4444',
        dangerDark: '#EF4444',

        'sent-bubble': '#0A84FF',
        'sent-bubbleDark': '#2563EB',

        'received-bubble': '#F3F4F6',
        'received-bubbleDark': '#1E293B',
      },
    },
  },

  plugins: [],
};
