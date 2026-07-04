/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4EDDE',
          soft: '#EFE6D2',
          deep: '#E7DCC3',
        },
        ink: {
          DEFAULT: '#211C16',
          soft: '#4A4238',
          faint: '#7A6F5F',
        },
        grass: {
          DEFAULT: '#2D6A4F',
          deep: '#1F4D39',
        },
        vermil: {
          DEFAULT: '#B3401E',
          deep: '#8E2F12',
        },
        gold: {
          DEFAULT: '#B08A2E',
          foil: '#D4AF37',
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
        card: '2px 2px 0 rgba(33,28,22,0.18)',
        foil: '0 0 0 1px #D4AF37, 0 0 14px rgba(212,175,55,0.45)',
      },
    },
  },
  plugins: [],
};
