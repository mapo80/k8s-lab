import { expect, test } from '@playwright/test'
import { apiGet, idSorgenteNuovo } from './support/api.js'

// Progetto «dati»: gli enti sono stati importati (e con loro l'idSorgente 13436).

async function compila(page, valori) {
  await expect(page.getByTestId('campo-provinciaId')).toBeEnabled()
  const campi = { tipo: 'PRIVATO', provinciaId: 'Bari', comune: 'Bari', ...valori }
  await page.getByTestId('campo-idSorgente').fill(campi.idSorgente)
  await page.getByTestId('campo-denominazione').fill(campi.denominazione)
  await page.getByTestId('campo-tipo').selectOption(campi.tipo)
  await page.getByTestId('campo-provinciaId').selectOption({ label: campi.provinciaId })
  await page.getByTestId('campo-comune').fill(campi.comune)
  if (campi.indirizzo) await page.getByTestId('campo-indirizzo').fill(campi.indirizzo)
  if (campi.telefono) await page.getByTestId('campo-telefono').fill(campi.telefono)
}

/**
 * La validazione lato client ha le stesse regole del backend: dall'interfaccia
 * un 400 non si può ottenere. Per vedere come la pagina mostra i campi in
 * errore del server si simula un client che non valida: il corpo della POST
 * si modifica in viaggio, e la risposta è quella vera del backend.
 */
async function modificaCorpo(page, modifica) {
  await page.route('**/api/enti', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const corpo = { ...route.request().postDataJSON(), ...modifica }
    return route.continue({ postData: JSON.stringify(corpo) })
  })
}

test.describe('Nuovo ente', () => {
  test('crea un ente e va al dettaglio, con i valori normalizzati dal server', async ({ page }) => {
    const idSorgente = idSorgenteNuovo()
    await page.goto('/enti')
    await page.getByTestId('link-nuovo-ente').click()
    await expect(page).toHaveURL(/\/enti\/nuovo$/)

    await compila(page, {
      idSorgente,
      denominazione: '  POLISPORTIVA E2E  ',
      tipo: 'PUBBLICO',
      provinciaId: 'Lecce',
      comune: 'Lecce',
      indirizzo: 'VIA DEI TEST 1',
      telefono: '0832 123 456',
    })
    const risposta = page.waitForResponse((r) => r.url().endsWith('/api/enti') && r.request().method() === 'POST')
    await page.getByTestId('salva-ente').click()

    const r = await risposta
    expect(r.status()).toBe(201)
    const id = /\/enti\/(\d+)$/.exec(r.headers()['location'])[1]
    await expect(page).toHaveURL(new RegExp(`/enti/${id}$`))
    await expect(page.getByTestId('ente-creato')).toBeVisible()
    await expect(page.getByTestId('dettaglio-denominazione')).toHaveText('POLISPORTIVA E2E')
    await expect(page.getByTestId('dettaglio-idSorgente')).toHaveText(idSorgente)
    await expect(page.getByTestId('dettaglio-tipo')).toHaveText('Pubblico')
    await expect(page.getByTestId('dettaglio-provincia')).toHaveText('Lecce')
    await expect(page.getByTestId('dettaglio-telefono')).toHaveText('0832123456')

    // ricaricando il dettaglio viene dal backend, senza il messaggio di conferma
    await page.reload()
    await expect(page.getByTestId('dettaglio-denominazione')).toHaveText('POLISPORTIVA E2E')
    await expect(page.getByTestId('ente-creato')).toHaveCount(0)
  })

  test('l\'ente creato si conta fra quelli della sua provincia', async ({ page, request }) => {
    const prima = (await apiGet(request, '/province/3/enti?size=1')).totaleElementi
    await page.goto('/enti/nuovo')
    await compila(page, { idSorgente: idSorgenteNuovo(), denominazione: 'CIRCOLO E2E', provinciaId: 'Brindisi', comune: 'Brindisi' })
    await page.getByTestId('salva-ente').click()
    await expect(page.getByTestId('ente-creato')).toBeVisible()

    await page.goto('/province/3')
    await expect(page.getByTestId('totale-elementi')).toHaveText(String(prima + 1))
  })

  test('la validazione lato client ferma il form senza chiamare il server', async ({ page }) => {
    const post = []
    page.on('request', (r) => r.method() === 'POST' && post.push(r.url()))
    await page.goto('/enti/nuovo')
    await expect(page.getByTestId('campo-provinciaId')).toBeEnabled()

    await page.getByTestId('salva-ente').click()
    for (const campo of ['idSorgente', 'denominazione', 'tipo', 'provinciaId', 'comune']) {
      await expect(page.getByTestId(`errore-${campo}`)).toBeVisible()
    }

    await page.getByTestId('campo-idSorgente').fill('X'.repeat(21))
    await expect(page.getByTestId('errore-idSorgente')).toHaveText('Al massimo 20 caratteri (ora sono 21)')
    await page.getByTestId('campo-telefono').fill('0'.repeat(31))
    await expect(page.getByTestId('errore-telefono')).toHaveText('Al massimo 30 caratteri (ora sono 31)')
    await page.getByTestId('salva-ente').click()

    expect(post).toEqual([])
    await expect(page).toHaveURL(/\/enti\/nuovo$/)
  })

  test('un 400 del server con i campi in errore si mostra accanto ai campi', async ({ page }) => {
    await modificaCorpo(page, { denominazione: '   ', comune: '', telefono: '0'.repeat(31) })
    await page.goto('/enti/nuovo')
    await compila(page, { idSorgente: idSorgenteNuovo(), denominazione: 'VALIDO' })

    const risposta = page.waitForResponse('**/api/enti')
    await page.getByTestId('salva-ente').click()

    expect((await risposta).status()).toBe(400)
    await expect(page.getByTestId('error-alert')).toContainText('Il server ha rifiutato alcuni campi')
    await expect(page.getByTestId('errore-denominazione')).toHaveText('non deve essere vuoto')
    await expect(page.getByTestId('errore-comune')).toHaveText('non deve essere vuoto')
    await expect(page.getByTestId('errore-telefono')).toHaveText('la dimensione deve essere compresa tra 0 e 30')
    await expect(page.getByTestId('errore-idSorgente')).toHaveCount(0)
    await expect(page).toHaveURL(/\/enti\/nuovo$/)
  })

  test('un tipo che non è PRIVATO né PUBBLICO dà un 400 sul campo tipo', async ({ page }) => {
    await modificaCorpo(page, { tipo: 'ALTRO' })
    await page.goto('/enti/nuovo')
    await compila(page, { idSorgente: idSorgenteNuovo(), denominazione: 'VALIDO' })

    await page.getByTestId('salva-ente').click()

    await expect(page.getByTestId('errore-tipo')).toHaveText('valore non valido per questo campo')
    await expect(page.getByTestId('error-alert')).toContainText('Il corpo contiene un valore non convertibile.')
  })

  test('un idSorgente già presente dà 409, sul campo idSorgente', async ({ page }) => {
    await page.goto('/enti/nuovo')
    // 13436 è il primo ente del file open data, già importato
    await compila(page, { idSorgente: '13436', denominazione: 'DOPPIONE' })

    const risposta = page.waitForResponse('**/api/enti')
    await page.getByTestId('salva-ente').click()

    expect((await risposta).status()).toBe(409)
    await expect(page.getByTestId('errore-idSorgente')).toHaveText('Esiste già un ente con idSorgente 13436')
    await expect(page.getByTestId('error-alert')).toContainText('idSorgente già presente')
    await expect(page).toHaveURL(/\/enti\/nuovo$/)

    // basta cambiare l'idSorgente perché l'errore sparisca e l'ente si crei
    await page.getByTestId('campo-idSorgente').fill(idSorgenteNuovo())
    await expect(page.getByTestId('errore-idSorgente')).toHaveCount(0)
    await page.getByTestId('salva-ente').click()
    await expect(page.getByTestId('ente-creato')).toBeVisible()
  })

  test('una provincia che non esiste più dà 404, sul campo provincia', async ({ page }) => {
    // la select offre solo province esistenti: si simula una provincia sparita dopo il caricamento
    await modificaCorpo(page, { provinciaId: 99 })
    await page.goto('/enti/nuovo')
    await compila(page, { idSorgente: idSorgenteNuovo(), denominazione: 'SENZA PROVINCIA' })

    const risposta = page.waitForResponse('**/api/enti')
    await page.getByTestId('salva-ente').click()

    expect((await risposta).status()).toBe(404)
    await expect(page.getByTestId('errore-provinciaId')).toContainText('Provincia inesistente')
    await expect(page.getByTestId('error-alert')).toContainText('Provincia con id 99 inesistente')
  })
})
