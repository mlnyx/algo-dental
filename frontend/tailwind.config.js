export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'palantir-dark': '#0F172A',
        'palantir-darker': '#0A0F1E',
        'palantir-blue': '#38BDF8',
        'palantir-grid': '#1E293B',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
