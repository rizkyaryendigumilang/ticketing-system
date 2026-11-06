/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      // Neutral chrome; colour is reserved for ticket status and app identity.
      colors: {
        canvas: '#EEF0F2',
        panel: '#FFFFFF',
        subtle: '#F5F6F7',
        line: '#D9DDE2',
        'line-strong': '#C3C9D0',
        ink: '#16202B',
        'ink-muted': '#5B6672',
        'ink-faint': '#8A949E',
      },
    },
  },
  plugins: [],
};
