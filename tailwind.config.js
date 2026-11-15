/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      // Apple & Ignara-grade neutral chrome; color reserved for status indicators and app identity
      colors: {
        canvas: 'rgb(var(--canvas-rgb) / <alpha-value>)',
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        subtle: 'rgb(var(--subtle-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint-rgb) / <alpha-value>)',
        // Admin command rail (deep obsidian dark chrome)
        rail: 'rgb(var(--rail-rgb) / <alpha-value>)',
        'rail-line': 'rgba(255, 255, 255, 0.08)',
        'rail-hover': 'rgba(255, 255, 255, 0.06)',
        accent: '#3B82F6',
      },
      transitionTimingFunction: {
        // Ignara Signature Quintic Glide
        ignara: 'cubic-bezier(0.22, 1, 0.36, 1)',
        // High-end Deceleration Curve (Expo Out)
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        // Physical Tactile Spring Overshoot (Modals, Toasts)
        'spring-pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Decisive Natural Exit
        'exit-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 2px rgba(0, 0, 0, 0.03), 0 6px 12px -4px rgba(0, 0, 0, 0.03)',
        popover: '0 2px 6px rgba(0, 0, 0, 0.04), 0 16px 32px -8px rgba(0, 0, 0, 0.08)',
        drawer: '0 2px 6px rgba(0, 0, 0, 0.06), 0 24px 48px -12px rgba(0, 0, 0, 0.14)',
        toast: '0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px -4px rgba(0, 0, 0, 0.12)',
        hairline: 'inset 0 0 0 1px rgb(var(--line-rgb) / 0.8)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scalePop: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        toastEnter: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-pop': 'scalePop 240ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-left': 'slideLeft 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-pop': 'toastEnter 260ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
};
