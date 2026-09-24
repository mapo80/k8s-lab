import { expect, test } from '@playwright/test'
import { accendiSorgente, spegniSorgente } from './support/ambiente.js'

// Progetto «vuoto»: il database è appena nato, nessun ente importato.

test.describe('Prima dell\'importazione', () => {
  test('l\'elenco degli enti è vuoto e invita a lanciare l\'importazione', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/enti$/)
    await expect(page.getByTestId('stato-vuoto')).toContainText('Non ci sono ancora enti')
    await expect(page.getByTestId('tabella-enti')).toHaveCount(0)

    await page.getByTestId('vuoto-link-import').click()
    await expect(page).toHaveURL(/\/importazione$/)
  })

  test('le sei province ci sono già, dalla migrazione, ma non hanno enti', async ({ page }) => {
    await page.goto('/province')

    const schede = page.getByTestId('provincia-card')
    await expect(schede).toHaveText([
      /Bari/, /Barletta-Andria-Trani/, /Brindisi/, /Foggia/, /Lecce/, /Taranto/,
    ])

    await schede.filter({ hasText: 'Lecce' }).click()
    await expect(page).toHaveURL(/\/province\/5$/)
    await expect(page.getByTestId('titolo-provincia')).toHaveText('Enti della provincia di Lecce')
    await expect(page.getByTestId('stato-vuoto')).toContainText('Nessun ente in questa provincia')
  })

  test('il dettaglio di un ente inesistente mostra il 404', async ({ page }) => {
    const risposta = page.waitForResponse('**/api/enti/999999')
    await page.goto('/enti/999999')

    expect((await risposta).status()).toBe(404)
    const alert = page.getByTestId('error-alert')
    await expect(alert).toContainText('Ente non trovato')
    await expect(alert).toContainText('Ente con id 999999 inesistente')
    await expect(page.getByTestId('dettaglio-ente')).toHaveCount(0)
  })

  test('gli enti di una provincia inesistente mostrano il 404', async ({ page }) => {
    await page.goto('/province/99')

    const alert = page.getByTestId('error-alert')
    await expect(alert).toContainText('Provincia non trovata')
    await expect(alert).toContainText('Provincia con id 99 inesistente')
  })

  /*
   * Il 503 si ottiene spegnendo davvero la finta sorgente open data, non con
   * page.route: così la catena è quella reale (il backend non raggiunge la
   * sorgente, il client HTTP va in errore, GestoreErrori risponde 503 con
   * Retry-After, il proxy lo inoltra) e il test verifica anche il backend.
   * page.route avrebbe provato solo che il frontend sa leggere un 503 scritto
   * a mano, e quello lo fanno già i test di unità.
   * Sta nel progetto «vuoto» perché dimostra anche che un import fallito non
   * salva nulla.
   */
  test('con la sorgente open data spenta l\'importazione risponde 503 e lo spiega', async ({ page }) => {
    spegniSorgente()
    try {
      await page.goto('/importazione')
      const risposta = page.waitForResponse('**/api/import/enti')
      await page.getByTestId('avvia-import').click()

      const r = await risposta
      expect(r.status()).toBe(503)
      expect(r.headers()['retry-after']).toBe('60')

      const alert = page.getByTestId('error-alert')
      await expect(alert).toContainText('La sorgente open data non risponde')
      await expect(page.getByTestId('riprova-tra')).toHaveText('Riprova tra 60 secondi: nessun ente è stato modificato.')
      await expect(page.getByTestId('esito-import')).toHaveCount(0)
      await expect(page.getByTestId('avvia-import')).toBeEnabled()
    } finally {
      accendiSorgente()
    }

    await page.goto('/enti')
    await expect(page.getByTestId('stato-vuoto')).toBeVisible()
  })
})
