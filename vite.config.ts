import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The full 255,168-game enumeration and the reconstruction sweeps are
    // deliberately brute-force; give them room.
    testTimeout: 120_000,
  },
});
