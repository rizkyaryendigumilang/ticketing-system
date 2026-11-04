/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#F6F5F1',
        panel: '#FFFFFF',
        subtle: '#F0EFEA',
        line: '#E2E0D8',
        'line-strong': '#CBC8BD',
        ink: '#141413',
        'ink-muted': '#575652',
        'ink-faint': '#85837D',
        rail: '#121316',
        'rail-hover': '#1C1E24',
        'rail-line': '#23252A',
      },
    },
  },
  plugins: [],
}
