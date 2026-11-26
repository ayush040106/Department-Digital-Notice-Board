/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dce6f5',
          200: '#b9cdeb',
          300: '#8baadd',
          400: '#5882cb',
          500: '#3560b5',
          600: '#254a97',
          700: '#1e3a7a',
          800: '#182f62',
          900: '#0f1e42',
          950: '#09132b',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 30, 66, 0.06), 0 1px 2px -1px rgba(15, 30, 66, 0.04)',
        'card-hover': '0 10px 24px -6px rgba(15, 30, 66, 0.09), 0 4px 10px -4px rgba(15, 30, 66, 0.05)',
      },
    },
  },
  plugins: [],
};
