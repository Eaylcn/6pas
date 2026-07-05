/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          soft: 'rgb(var(--paper-soft) / <alpha-value>)',
          deep: 'rgb(var(--paper-deep) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        grass: {
          DEFAULT: 'rgb(var(--grass) / <alpha-value>)',
          deep: 'rgb(var(--grass-deep) / <alpha-value>)',
        },
        vermil: {
          DEFAULT: 'rgb(var(--vermil) / <alpha-value>)',
          deep: 'rgb(var(--vermil-deep) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          foil: 'rgb(var(--gold-foil) / <alpha-value>)',
        },
        rarity: {
          common: '#7A7266',
          solid: '#8C6239',
          pro: '#2B547E',
          star: '#7B2D3A',
          legend: '#B08A2E',
          icon: '#D4AF37',
        },
      },
      fontFamily: {
        headline: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        score: ['"Archivo Narrow"', '"Arial Narrow"', 'sans-serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '2px 2px 0 rgb(var(--ink) / 0.18)',
        foil: '0 0 0 1px rgb(var(--gold-foil)), 0 0 14px rgb(var(--gold-foil) / 0.45)',
      },
    },
  },
  plugins: [],
};
