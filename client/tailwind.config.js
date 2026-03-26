/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f2f8f4',
          100: '#e0f0e5',
          200: '#bcdfc8',
          300: '#8ec7a5',
          400: '#5daa7e',
          500: '#3d9162',
          600: '#2d7450',
          700: '#255d41',
          800: '#1f4a35',
          900: '#1a3d2c',
        },
        peach: {
          50:  '#fff8f5',
          100: '#feeee5',
          200: '#fdd5bc',
          300: '#fbb48d',
          400: '#f8895a',
          500: '#f46530',
          600: '#e04e1a',
          700: '#ba3d14',
          800: '#963216',
          900: '#7a2c16',
        },
        cream: {
          50:  '#fefcf9',
          100: '#fdf7ef',
          200: '#faecd8',
          300: '#f5ddb8',
          400: '#edc98c',
          500: '#e3b262',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(61,145,98,0.08), 0 1px 4px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 8px 32px 0 rgba(61,145,98,0.14), 0 2px 8px 0 rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};