import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--color-bg) / <alpha-value>)',
        'bg-deep': 'hsl(var(--color-bg-deep) / <alpha-value>)',
        panel: 'rgba(255,255,255,0.035)',
        'panel-strong': 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.14)',

        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        'primary-dim': 'hsl(var(--color-primary) / 0.12)',
        'primary-border': 'hsl(var(--color-primary) / 0.3)',

        text: 'hsl(var(--color-text) / <alpha-value>)',
        'text-dim': 'hsl(var(--color-text-dim) / <alpha-value>)',
        'text-muted': 'hsl(var(--color-text-muted) / <alpha-value>)',
        'text-faint': 'hsl(var(--color-text-faint) / <alpha-value>)',

        exp: 'hsl(var(--color-exp) / <alpha-value>)',
        'exp-bg': 'hsl(var(--color-exp) / 0.12)',
        frags: 'hsl(var(--color-frags) / <alpha-value>)',
        'frags-bg': 'hsl(var(--color-frags) / 0.12)',
        nodes: 'hsl(var(--color-nodes) / <alpha-value>)',
        'nodes-bg': 'hsl(var(--color-nodes) / 0.12)',
        mesos: 'hsl(var(--color-mesos) / <alpha-value>)',
        'mesos-bg': 'hsl(var(--color-mesos) / 0.12)',
        common: 'hsl(var(--color-common) / <alpha-value>)',
        'common-bg': 'hsl(var(--color-common) / 0.12)',
        rare: 'hsl(var(--color-rare) / <alpha-value>)',
        'rare-bg': 'hsl(var(--color-rare) / 0.12)',

        danger: 'hsl(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px hsl(var(--color-primary) / 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
