import { expect, test } from '@playwright/test'
import { apiGet } from './support/api.js'

// Progetto «dati»: gli enti sono stati importati.

test.describe('Province', () => {
  test('ogni provincia porta ai suoi enti, e i totali sommano quello generale', async ({ page, request }) => {
    const totale = (await apiGet(request, '/enti?size=1')).totaleElementi
    const province = await apiGet(request, '/province')
    expect(province.contenuto).toHaveLength(6)

    let somma = 0
    for (const provincia of province.contenuto) {
      const enti = await apiGet(request, `/province/${provincia.id}/enti?size=1`)
      await page.goto('/province')
      await page.getByTestId('provincia-card').filter({ hasText: provincia.nome }).click()

      await expect(page).toHaveURL(new RegExp(`/province/${provincia.id}$`))
      await expect(page.getByTestId('titolo-provincia')).toHaveText(`Enti della provincia di ${provincia.nome}`)
      await expect(page.getByTestId('totale-elementi')).toHaveText(enti.totaleElementi.toLocaleString('it-IT', { useGrouping: 'always' }))
      somma += enti.totaleElementi
    }
    expect(somma).toBe(totale)
  })

  test('gli enti di Lecce sono paginati e ordinabili come l\'elenco generale', async ({ page, request }) => {
    await page.goto('/province/5')
    await expect(page.getByTestId('riga-ente')).toHaveCount(20)
    // la colonna provincia qui non serve
    await expect(page.getByTestId('ordina-provincia')).toHaveCount(0)
    const tutti = await apiGet(request, '/province/5/enti?size=1')
    const pagine = Math.ceil(tutti.totaleElementi / 20)
    await expect(page.getByTestId('riepilogo-pagina')).toContainText(`Pagina 1 di ${pagine}`)

    await page.getByTestId('pagina-successiva').click()
    await expect(page).toHaveURL(/\/province\/5\?page=1$/)
    const seconda = await apiGet(request, '/province/5/enti?page=1&size=20&sort=denominazione,asc&sort=id,asc')
    await expect(page.getByTestId('link-ente')).toHaveText(seconda.contenuto.map((e) => e.denominazione))

    await page.getByTestId('dimensione-select').selectOption('50')
    await page.getByTestId('ordina-comune').click()
    await page.getByTestId('ordina-comune').click()
    await expect(page).toHaveURL(/size=50/)
    await expect(page).toHaveURL(/sort=comune%2Cdesc/)
    const perComune = await apiGet(request, '/province/5/enti?page=0&size=50&sort=comune,desc&sort=id,asc')
    await expect(page.getByTestId('riga-ente')).toHaveCount(50)
    await expect(page.getByTestId('link-ente')).toHaveText(perComune.contenuto.map((e) => e.denominazione))

    // ricaricando resta tutto com'era
    await page.reload()
    await expect(page.getByTestId('link-ente')).toHaveText(perComune.contenuto.map((e) => e.denominazione))
  })
})
