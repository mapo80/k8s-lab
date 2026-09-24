import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Il backend non ha CORS e le sue rotte non hanno il prefisso /api: in sviluppo
// il browser chiama /api/... sullo stesso origin di Vite, e il proxy inoltra
// al backend togliendo il prefisso (/api/enti -> http://localhost:8080/enti).
// In produzione fa lo stesso nginx (nginx.conf). API_TARGET serve ai test e2e,
// che usano un backend su un'altra porta.
const API_TARGET = process.env.API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['e2e/**', 'node_modules/**'],
    reporters: [
      'default',
      ['junit', { outputFile: './reports/unit/junit.xml' }],
      ['html', { outputDir: './reports/unit/html', singleFile: true }],
    ],
  },
})
