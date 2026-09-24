import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// ogni test parte con l'API originale: gli spy di un test non passano al successivo
afterEach(() => {
  vi.restoreAllMocks()
})
