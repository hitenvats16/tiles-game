/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        scribble: ['"Patrick Hand"', '"Comic Neue"', 'cursive', 'system-ui'],
        sketch: ['"Caveat"', '"Patrick Hand"', 'cursive', 'system-ui'],
      },
      colors: {
        ink: '#1f1d1d',
        paper: '#fdfaf2',
        line: '#2b2728',
      },
      boxShadow: {
        scribble: '4px 4px 0 0 #1f1d1d',
        scribbleSm: '2px 2px 0 0 #1f1d1d',
      },
      keyframes: {
        wobble: {
          '0%,100%': { transform: 'rotate(-0.5deg)' },
          '50%': { transform: 'rotate(0.5deg)' },
        },
      },
      animation: {
        wobble: 'wobble 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
