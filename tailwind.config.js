/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        cream: {
          50:  '#FDFCFA',
          100: '#F8F7F4',
          200: '#F0EDE6',
          300: '#E4DED4',
          400: '#C9BFB3',
        },
        ink: {
          900: '#1C1917',
          700: '#44403C',
          500: '#78716C',
          300: '#A8A29E',
          100: '#D6D3D1',
        },
        blue: {
          600: '#3451D1',
          500: '#4361EE',
          400: '#6B84F5',
          100: '#EEF1FD',
          50:  '#F5F7FF',
        },
        green: {
          600: '#16A34A',
          500: '#22C55E',
          100: '#DCFCE7',
          50:  '#F0FDF4',
        },
        red: {
          600: '#DC2626',
          500: '#EF4444',
          100: '#FEE2E2',
          50:  '#FFF5F5',
        },
        amber: {
          500: '#F59E0B',
          100: '#FEF3C7',
          50:  '#FFFBEB',
        },
      },
      boxShadow: {
        'card':    '0 1px 4px 0 rgba(28,25,23,0.06), 0 4px 16px 0 rgba(28,25,23,0.04)',
        'card-md': '0 2px 8px 0 rgba(28,25,23,0.08), 0 8px 24px 0 rgba(28,25,23,0.06)',
        'card-lg': '0 4px 16px 0 rgba(28,25,23,0.1),  0 16px 48px 0 rgba(28,25,23,0.08)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease both',
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-in':  'slideIn 0.35s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}