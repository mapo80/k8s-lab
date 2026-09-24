import { expect, test } from '@playwright/test'

// Progetto «importazione»: gira dopo «vuoto», sul database ancora senza enti.

test.describe('Importazione dall\'open data', () => {
  test('la prima importazione inserisce 1.739 enti e scarta il record senza id', async ({ page }) => {
    /*
     * L'import vero dura poco sul file locale: la risposta del backend si
     * trattiene un secondo prima di darla alla pagina, così lo stato di
     * caricamento resta visibile abbastanza da verificarlo. La richiesta arriva
     * comunque al backend vero, e la risposta è la sua.
     */
    await page.route('**/api/import/enti', async (route) => {
      const risposta = await route.fetch()
      await new Promise((ok) => setTimeout(ok, 1000))
      await route.fulfill({ response: risposta })
    })
    await page.goto('/importazione')

    await page.getByTestId('avvia-import').click()

    await expect(page.getByTestId('avvia-import')).toBeDisabled()
    await expect(page.getByTestId('avvia-import')).toHaveText('Importazione in corso...')
    await expect(page.getByTestId('spinner')).toContainText('qualche secondo')

    await expect(page.getByTestId('esito-inseriti')).toHaveText('1.739')
    await expect(page.getByTestId('esito-gia-presenti')).toHaveText('0')
    await expect(page.getByTestId('esito-scartati')).toHaveText('1')
    await expect(page.getByTestId('esito-messaggio')).toContainText('1.739 enti nuovi')
    await expect(page.getByTestId('avvia-import')).toBeEnabled()

    await page.getByTestId('vai-elenco').click()
    await expect(page.getByTestId('totale-elementi')).toHaveText('1.739')
  })

  test('rilanciata non crea duplicati: 0 inseriti e 1.739 già presenti', async ({ page }) => {
    await page.goto('/importazione')

    await page.getByTestId('avvia-import').click()

    await expect(page.getByTestId('esito-inseriti')).toHaveText('0')
    await expect(page.getByTestId('esito-gia-presenti')).toHaveText('1.739')
    await expect(page.getByTestId('esito-scartati')).toHaveText('1')
    await expect(page.getByTestId('esito-messaggio')).toContainText('nessun ente nuovo')

    await page.goto('/enti')
    await expect(page.getByTestId('totale-elementi')).toHaveText('1.739')
  })
})
