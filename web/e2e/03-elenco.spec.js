import { expect, test } from '@playwright/test'
import { apiGet } from './support/api.js'

// Progetto «dati»: gli enti sono stati importati.

const SPAREGGIO = '&sort=id,asc'

test.describe('Elenco degli enti', () => {
  test('la prima pagina ha 20 enti per denominazione crescente, con il nome della provincia', async ({ page, request }) => {
    const attesa = await apiGet(request, `/enti?page=0&size=20&sort=denominazione,asc${SPAREGGIO}`)
    await page.goto('/enti')

    await expect(page.getByTestId('riga-ente')).toHaveCount(20)
    await expect(page.getByTestId('link-ente')).toHaveText(attesa.contenuto.map((e) => e.denominazione))
    await expect(page.getByTestId('riepilogo-pagina')).toHaveText('Pagina 1 di 87 · 1.739 enti')

    // la provincia è il nome, non l'id
    await expect(page.locator('[data-colonna="provincia"]')).toHaveText(attesa.contenuto.map((e) => e.provincia))
    for (const nome of await page.locator('[data-colonna="provincia"]').allTextContents()) {
      expect(['Bari', 'Barletta-Andria-Trani', 'Brindisi', 'Foggia', 'Lecce', 'Taranto']).toContain(nome)
    }
  })

  test('si naviga fra le pagine, e la pagina sta nell\'URL', async ({ page, request }) => {
    await page.goto('/enti')
    await expect(page.getByTestId('riga-ente')).toHaveCount(20)

    await page.getByTestId('pagina-successiva').click()
    await expect(page).toHaveURL(/[?&]page=1(&|$)/)
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('Pagina 2 di 87')
    const seconda = await apiGet(request, `/enti?page=1&size=20&sort=denominazione,asc${SPAREGGIO}`)
    await expect(page.getByTestId('link-ente').first()).toHaveText(seconda.contenuto[0].denominazione)

    // ricaricando si resta sulla stessa pagina
    await page.reload()
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('Pagina 2 di 87')
    await expect(page.getByTestId('link-ente').first()).toHaveText(seconda.contenuto[0].denominazione)

    // l'ultima pagina ha 1739 - 86 * 20 = 19 enti
    await page.getByTestId('pagina-ultima').click()
    await expect(page).toHaveURL(/[?&]page=86(&|$)/)
    await expect(page.getByTestId('riga-ente')).toHaveCount(19)
    await expect(page.getByTestId('pagina-successiva')).toBeDisabled()

    await page.getByTestId('pagina-precedente').click()
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('Pagina 86 di 87')

    await page.getByTestId('pagina-prima').click()
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('Pagina 1 di 87')
    await expect(page.getByTestId('pagina-precedente')).toBeDisabled()
  })

  test('le pagine non si sovrappongono: nessun ente compare due volte', async ({ page }) => {
    // 40 denominazioni si ripetono: senza lo spareggio per id una riga potrebbe comparire in due pagine
    const visti = new Set()
    await page.goto('/enti?size=100')
    for (let numero = 0; numero < 18; numero++) {
      await page.goto(`/enti?size=100&page=${numero}`)
      await expect(page.getByTestId('riepilogo-pagina')).toContainText(`Pagina ${numero + 1} di 18`)
      await expect(page.getByTestId('elenco-enti')).toHaveAttribute('aria-busy', 'false')
      for (const id of await page.getByTestId('riga-ente').evaluateAll((righe) => righe.map((r) => r.dataset.enteId))) {
        visti.add(id)
      }
    }
    expect(visti.size).toBe(1739)
  })

  test('la dimensione si sceglie fino a 100, anche dall\'URL', async ({ page }) => {
    await page.goto('/enti?page=3')

    await page.getByTestId('dimensione-select').selectOption('100')
    await expect(page).toHaveURL(/size=100/)
    await expect(page).toHaveURL(/page=0/)
    await expect(page.getByTestId('riga-ente')).toHaveCount(100)
    await expect(page.getByTestId('riepilogo-pagina')).toHaveText('Pagina 1 di 18 · 1.739 enti')

    await page.getByTestId('dimensione-select').selectOption('10')
    await expect(page.getByTestId('riga-ente')).toHaveCount(10)
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('di 174')

    // oltre il tetto: si chiede 100, come farebbe il backend
    await page.goto('/enti?size=5000')
    await expect(page.getByTestId('riga-ente')).toHaveCount(100)
    await expect(page.getByTestId('dimensione-select')).toHaveValue('100')
  })

  test('si ordina cliccando sulle colonne, in senso crescente e decrescente', async ({ page, request }) => {
    await page.goto('/enti')
    await expect(page.getByTestId('riga-ente')).toHaveCount(20)

    // denominazione: già crescente, il clic la inverte
    await page.getByTestId('ordina-denominazione').click()
    await expect(page).toHaveURL(/sort=denominazione%2Cdesc/)
    const decrescente = await apiGet(request, `/enti?size=20&sort=denominazione,desc${SPAREGGIO}`)
    await expect(page.getByTestId('link-ente')).toHaveText(decrescente.contenuto.map((e) => e.denominazione))
    await expect(page.getByRole('columnheader', { name: /Denominazione/ })).toHaveAttribute('aria-sort', 'descending')

    // provincia: un'altra colonna parte dal crescente, poi si inverte
    await page.getByTestId('ordina-provincia').click()
    await expect(page).toHaveURL(/sort=provincia\.nome%2Casc/)
    await expect(page.locator('[data-colonna="provincia"]').first()).toHaveText('Bari')
    await page.getByTestId('ordina-provincia').click()
    await expect(page).toHaveURL(/sort=provincia\.nome%2Cdesc/)
    await expect(page.locator('[data-colonna="provincia"]').first()).toHaveText('Taranto')

    // tipo: i privati prima dei pubblici in senso crescente
    await page.getByTestId('ordina-tipo').click()
    await expect(page.locator('[data-colonna="tipo"]').first()).toHaveText('Privato')
    await page.getByTestId('ordina-tipo').click()
    await expect(page.locator('[data-colonna="tipo"]').first()).toHaveText('Pubblico')

    // comune, con la seconda pagina: l'ordinamento resta nell'URL anche cambiando pagina
    await page.getByTestId('ordina-comune').click()
    await page.getByTestId('pagina-successiva').click()
    await expect(page).toHaveURL(/sort=comune%2Casc/)
    await expect(page).toHaveURL(/page=1/)
    const perComune = await apiGet(request, `/enti?page=1&size=20&sort=comune,asc${SPAREGGIO}`)
    await expect(page.getByTestId('link-ente')).toHaveText(perComune.contenuto.map((e) => e.denominazione))
  })

  test('azioni ravvicinate non si cancellano a vicenda', async ({ page }) => {
    // ordina, cambia dimensione e pagina senza aspettare che la tabella si aggiorni
    await page.goto('/enti')
    await expect(page.getByTestId('riga-ente')).toHaveCount(20)

    await page.getByTestId('ordina-comune').click()
    await page.getByTestId('dimensione-select').selectOption('50')
    await page.getByTestId('pagina-successiva').click()

    await expect(page).toHaveURL(/\/enti\?page=1&sort=comune%2Casc&size=50$/)
    await expect(page.getByTestId('riga-ente')).toHaveCount(50)
    await expect(page.getByTestId('riepilogo-pagina')).toContainText('Pagina 2 di 35')

    // il pulsante indietro del browser riporta allo stato precedente, e da lì si riparte
    await page.goBack()
    await expect(page).toHaveURL(/\/enti\?page=0&sort=comune%2Casc&size=50$/)
    await page.getByTestId('ordina-comune').click()
    await expect(page).toHaveURL(/\/enti\?page=0&sort=comune%2Cdesc&size=50$/)
  })

  test('dall\'elenco si apre il dettaglio dell\'ente, con tutti i campi', async ({ page, request }) => {
    await page.goto('/enti?sort=comune,desc')
    const riga = page.getByTestId('riga-ente').first()
    const id = await riga.getAttribute('data-ente-id')
    const ente = await apiGet(request, `/enti/${id}`)

    await riga.getByTestId('link-ente').click()

    await expect(page).toHaveURL(new RegExp(`/enti/${id}$`))
    await expect(page.getByTestId('dettaglio-denominazione')).toHaveText(ente.denominazione)
    await expect(page.getByTestId('dettaglio-idSorgente')).toHaveText(ente.idSorgente)
    await expect(page.getByTestId('dettaglio-provincia')).toHaveText(ente.provincia)
    await expect(page.getByTestId('dettaglio-comune')).toHaveText(ente.comune)
    await expect(page.getByTestId('dettaglio-indirizzo')).toHaveText(ente.indirizzo ?? '—')
    await expect(page.getByTestId('dettaglio-telefono')).toHaveText(ente.telefono ?? '—')

    await page.getByTestId('torna-elenco').click()
    await expect(page).toHaveURL(/\/enti$/)
  })
})
