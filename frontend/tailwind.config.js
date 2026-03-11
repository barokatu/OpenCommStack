/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          primary: '#075E54',
          secondary: '#128C7E',
          accent: '#25D366',
          light: '#DCF8C6',
          dark: '#111B21',
          darkSurface: '#1F2C34',
          darkInput: '#2A3942',
          darkBubble: '#005C4B',
          chatBg: '#E5DDD5',
          chatBgDark: '#0B141A',
          header: '#075E54',
          headerDark: '#1F2C34',
          unread: '#25D366',
          blue: '#53BDEB',
          grey: '#8696A0',
          separator: '#E9EDEF',
          separatorDark: '#222D34',
          incoming: '#FFFFFF',
          outgoing: '#DCF8C6',
          outgoingDark: '#005C4B',
          incomingDark: '#202C33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite ease-in-out both',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
