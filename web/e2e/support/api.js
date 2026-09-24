import { expect } from '@playwright/test'

/**
 * Legge dal backend, attraverso lo stesso proxy /api dell'app, i dati che la
 * pagina dovrebbe mostrare: i test confrontano l'interfaccia con la risposta
 * vera, non con numeri scritti a mano.
 */
export async function apiGet(request, percorso) {
  const risposta = await request.get(`/api${percorso}`)
  expect(risposta.ok(), `GET ${percorso} -> ${risposta.status()}`).toBeTruthy()
  return risposta.json()
}

/** Un idSorgente che non esiste ancora: al massimo 20 caratteri, come vuole il backend. */
export function idSorgenteNuovo() {
  return `E2E${Date.now()}`.slice(0, 20)
}
