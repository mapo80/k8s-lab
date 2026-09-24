import { defineConfig, devices } from '@playwright/test'
import { API_E2E } from './e2e/support/ambiente.js'

const PORTA_WEB = 5174

/**
 * I test girano contro il backend vero con PostgreSQL, avviato in Docker da
 * global-setup (e2e/docker-compose.yml), e contro l'app servita da Vite, che
 * fa da proxy verso quel backend.
 *
 * Il database parte vuoto, e i test sono divisi in tre progetti che girano
 * in sequenza, perché lo stato dei dati conta:
 *   1. vuoto        - prima dell'import: liste vuote, 404, 503 sull'import
 *   2. importazione - la prima import (1739/0/1) e la seconda (0/1739/1)
 *   3. dati         - elenco, dettaglio, province e creazione, sui dati importati
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  // niente retry: i test dipendono dallo stato dei dati (una seconda import dà
  // 0/1739/1, non 1739/0/1), e un retry nasconderebbe un errore invece di ripararlo
  retries: 0,
  timeout: 30_000,
  outputDir: './reports/e2e/test-results',
  globalSetup: './e2e/support/global-setup.js',
  globalTeardown: './e2e/support/global-teardown.js',
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/e2e/html', open: 'never' }],
    ['junit', { outputFile: './reports/e2e/junit.xml' }],
  ],
  use: {
    baseURL: `http://localhost:${PORTA_WEB}`,
    trace: 'retain-on-failure',
    // uno screenshot per ogni test, non solo per quelli falliti: è l'evidenza nel report
    screenshot: 'on',
  },
  projects: [
    {
      name: 'vuoto',
      testMatch: /01-.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'importazione',
      testMatch: /02-.*\.spec\.js/,
      dependencies: ['vuoto'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'dati',
      testMatch: /0[3-9]-.*\.spec\.js/,
      dependencies: ['importazione'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORTA_WEB} --strictPort`,
    url: `http://localhost:${PORTA_WEB}`,
    env: { API_TARGET: API_E2E },
    timeout: 60_000,
    // mai un server già avviato: deve fare proxy verso il backend dei test, non verso quello di sviluppo
    reuseExistingServer: false,
  },
})
