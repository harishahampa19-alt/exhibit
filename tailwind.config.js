/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Instrument chassis
        void: '#08090b',
        panel: '#0e1013',
        panel2: '#14171c',
        rule: '#1e232a',
        rule2: '#2a313a',

        // Type
        ink: '#c9ced6',
        inkdim: '#7b838f',
        inkfaint: '#4c545f',

        // The two poles of the framework
        realized: '#e0a340', // warm — a collapse that happened
        realizedDim: '#7a5a24',
        chaos: '#3f6d80', // cool, dim — unformed possibility
        chaosDim: '#24404b',

        // Roles
        observer: '#e0a340',
        opponent: '#6f8fa8',

        // Honesty tiers
        tierMath: '#4fb286', // verified mathematics
        tierAxiom: '#e0a340', // framework axioms
        tierInterp: '#9c7bb8', // interpretation

        alarm: '#c9584f',
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'JetBrains Mono',
          'Cascadia Mono',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
