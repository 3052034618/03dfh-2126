/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        night: {
          900: '#0D0D1A',
          800: '#1A1A2E',
          700: '#16213E',
          600: '#1F2B47',
          500: '#2A3A5C',
        },
        neon: {
          pink: '#E94560',
          pinkLight: '#FF6B81',
          pinkDark: '#C73A52',
          gold: '#F0C27F',
          goldLight: '#F5D5A0',
          blue: '#4FC3F7',
          green: '#66BB6A',
          purple: '#AB47BC',
        },
      },
      fontFamily: {
        display: ['"ZCOOL QingKe HuangYou"', 'cursive'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(233, 69, 96, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(233, 69, 96, 0.8)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #E94560, #FF6B81)',
        'gold-gradient': 'linear-gradient(135deg, #F0C27F, #F5D5A0)',
        'night-gradient': 'linear-gradient(180deg, #1A1A2E, #0D0D1A)',
      },
    },
  },
  plugins: [],
};
