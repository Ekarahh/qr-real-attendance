import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // While developing, this page runs on port 5173 but the Express API runs on
    // port 3000. This forwards anything the API owns over to Express so the
    // fetch calls in the pages can just say '/api/...' and work in both places.
    proxy: {
      '/api': 'http://localhost:3000',
      '/export.csv': 'http://localhost:3000'
    }
  },
  build: {
    // Express serves the finished files from here.
    outDir: 'dist'
  }
});
