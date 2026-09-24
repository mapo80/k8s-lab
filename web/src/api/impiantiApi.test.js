import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  creaEnte,
  getEnte,
  getEnti,
  getEntiDellaProvincia,
  getProvince,
  idDaLocation,
  importaEnti,
  leggiRetryAfter,
  queryPaginazione,
} from './impiantiApi'

/** Una Response minima, con gli header che il modulo legge. */
function risposta(status, corpo, header = {}) {
  const intestazioni = new Headers(header)
  if (corpo !== undefined && !intestazioni.has('Content-Type')) {
    intestazioni.set('Content-Type', status >= 400 ? 'application/problem+json' : 'application/json')
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: intestazioni,
    json: () => (corpo === undefined ? Promise.reject(new Error('nessun corpo')) : Promise.resolve(corpo)),
  }
}

function fetchRisponde(...risposte) {
  const mock = vi.fn()
  for (const r of risposte) mock.mockResolvedValueOnce(r)
  vi.stubGlobal('fetch', mock)
  return mock
}

const PAGINA_VUOTA = { contenuto: [], pagina: 0, dimensione: 20, totaleElementi: 0, totalePagine: 0 }

describe('queryPaginazione', () => {
  it('senza parametri non manda nulla: decide il default del backend', () => {
    expect(queryPaginazione()).toBe('')
    expect(queryPaginazione({})).toBe('')
  })

  it('manda page, size e sort, con id crescente come spareggio', () => {
    expect(queryPaginazione({ page: 2, size: 50, sort: 'comune,desc' }))
      .toBe('?page=2&size=50&sort=comune%2Cdesc&sort=id%2Casc')
  })

  it('la pagina 0 si manda comunque: 0 non è un valore assente', () => {
    expect(queryPaginazione({ page: 0 })).toBe('?page=0')
  })

  it('non aggiunge lo spareggio se si ordina già per id', () => {
    expect(queryPaginazione({ sort: 'id,desc' })).toBe('?sort=id%2Cdesc')
  })
})

describe('impiantiApi', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('getEnti chiama GET /api/enti con i parametri di paginazione', async () => {
    const fetch = fetchRisponde(risposta(200, PAGINA_VUOTA))

    const pagina = await getEnti({ page: 1, size: 20, sort: 'denominazione,asc' })

    expect(fetch).toHaveBeenCalledWith('/api/enti?page=1&size=20&sort=denominazione%2Casc&sort=id%2Casc', undefined)
    expect(pagina).toEqual(PAGINA_VUOTA)
  })

  it('getEnti senza parametri chiama /api/enti', async () => {
    const fetch = fetchRisponde(risposta(200, PAGINA_VUOTA))
    await getEnti()
    expect(fetch).toHaveBeenCalledWith('/api/enti', undefined)
  })

  it('getEnte chiama GET /api/enti/{id}, con l\'id codificato', async () => {
    const fetch = fetchRisponde(risposta(200, { id: 7 }), risposta(200, {}))
    await getEnte(7)
    await getEnte('a/b')
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/enti/7', undefined)
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/enti/a%2Fb', undefined)
  })

  it('getEnte legge il ProblemDetail del 404', async () => {
    fetchRisponde(risposta(404, {
      type: 'about:blank', title: 'Risorsa inesistente', status: 404, detail: 'Ente con id 999 inesistente',
    }))

    const errore = await getEnte(999).catch((e) => e)

    expect(errore).toBeInstanceOf(ApiError)
    expect(errore).toMatchObject({
      status: 404,
      title: 'Risorsa inesistente',
      detail: 'Ente con id 999 inesistente',
      message: 'Ente con id 999 inesistente',
      errori: [],
    })
  })

  it('getProvince chiede tutte le province in una pagina e restituisce il contenuto', async () => {
    const province = [{ id: 1, nome: 'Bari' }, { id: 5, nome: 'Lecce' }]
    const fetch = fetchRisponde(risposta(200, { ...PAGINA_VUOTA, contenuto: province, totaleElementi: 2 }))

    expect(await getProvince()).toEqual(province)
    expect(fetch).toHaveBeenCalledWith('/api/province?size=100&sort=nome%2Casc&sort=id%2Casc', undefined)
  })

  it('getEntiDellaProvincia chiama GET /api/province/{id}/enti con la paginazione', async () => {
    const fetch = fetchRisponde(risposta(200, PAGINA_VUOTA))
    await getEntiDellaProvincia(5, { page: 0, size: 100, sort: 'comune,asc' })
    expect(fetch).toHaveBeenCalledWith('/api/province/5/enti?page=0&size=100&sort=comune%2Casc&sort=id%2Casc', undefined)
  })

  it('creaEnte invia POST /api/enti con il corpo JSON e legge l\'id dall\'header Location', async () => {
    const creato = { id: 1741, idSorgente: '90001', denominazione: 'PROVA' }
    const fetch = fetchRisponde(risposta(201, creato, { Location: '/enti/1741' }))
    const dati = { idSorgente: '90001', denominazione: 'PROVA', tipo: 'PRIVATO', provinciaId: 1, comune: 'Bari' }

    const esito = await creaEnte(dati)

    expect(fetch).toHaveBeenCalledWith('/api/enti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    })
    expect(esito).toEqual({ id: 1741, ente: creato })
  })

  it('creaEnte senza header Location usa l\'id del corpo', async () => {
    fetchRisponde(risposta(201, { id: 12 }))
    expect((await creaEnte({})).id).toBe(12)
  })

  it('creaEnte legge i campi in errore del 400', async () => {
    fetchRisponde(risposta(400, {
      title: 'Richiesta non valida',
      status: 400,
      detail: 'Alcuni campi del corpo non sono validi.',
      errori: [
        { campo: 'denominazione', messaggio: 'non deve essere vuoto' },
        { campo: 'telefono', messaggio: 'la dimensione deve essere compresa tra 0 e 30' },
      ],
    }))

    const errore = await creaEnte({}).catch((e) => e)

    expect(errore.status).toBe(400)
    expect(errore.errori).toEqual([
      { campo: 'denominazione', messaggio: 'non deve essere vuoto' },
      { campo: 'telefono', messaggio: 'la dimensione deve essere compresa tra 0 e 30' },
    ])
  })

  it('creaEnte lancia ApiError 409 con il detail del server', async () => {
    fetchRisponde(risposta(409, { title: 'idSorgente già presente', status: 409, detail: 'Esiste già un ente con idSorgente 13436' }))
    await expect(creaEnte({})).rejects.toMatchObject({ status: 409, detail: 'Esiste già un ente con idSorgente 13436' })
  })

  it('creaEnte lancia ApiError 404 se la provincia non esiste', async () => {
    fetchRisponde(risposta(404, { title: 'Risorsa inesistente', status: 404, detail: 'Provincia con id 99 inesistente' }))
    await expect(creaEnte({})).rejects.toMatchObject({ status: 404, detail: 'Provincia con id 99 inesistente' })
  })

  it('importaEnti invia POST /api/import/enti e restituisce l\'esito', async () => {
    const fetch = fetchRisponde(risposta(200, { inseriti: 1739, giaPresenti: 0, scartati: 1 }))

    expect(await importaEnti()).toEqual({ inseriti: 1739, giaPresenti: 0, scartati: 1 })
    expect(fetch).toHaveBeenCalledWith('/api/import/enti', { method: 'POST' })
  })

  it('importaEnti sul 503 riporta il ProblemDetail e i secondi di Retry-After', async () => {
    fetchRisponde(risposta(503, {
      title: 'Sorgente open data non disponibile', status: 503, detail: 'La sorgente open data non risponde: riprova più tardi.',
    }, { 'Retry-After': '60' }))

    await expect(importaEnti()).rejects.toMatchObject({
      status: 503,
      title: 'Sorgente open data non disponibile',
      retryAfter: 60,
    })
  })

  it('un errore con corpo non JSON (per esempio la pagina di un proxy) diventa un ApiError con lo stato', async () => {
    fetchRisponde(risposta(502, undefined, { 'Content-Type': 'text/html' }))

    const errore = await getEnti().catch((e) => e)

    expect(errore).toBeInstanceOf(ApiError)
    expect(errore).toMatchObject({ status: 502, title: null, detail: null, errori: [] })
    expect(errore.message).toBe('Richiesta fallita (HTTP 502)')
  })

  it('un errore dichiarato JSON ma con il corpo illeggibile non fa saltare la gestione', async () => {
    fetchRisponde(risposta(500, undefined, { 'Content-Type': 'application/problem+json' }))
    await expect(getEnti()).rejects.toMatchObject({ status: 500, detail: null })
  })

  it('se il server non risponde affatto l\'errore ha stato 0 e un messaggio chiaro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const errore = await getEnti().catch((e) => e)

    expect(errore).toBeInstanceOf(ApiError)
    expect(errore.status).toBe(0)
    expect(errore.message).toMatch(/server non risponde/)
  })
})

describe('idDaLocation', () => {
  it('legge l\'id da un Location relativo o assoluto', () => {
    expect(idDaLocation('/enti/42')).toBe(42)
    expect(idDaLocation('http://localhost:8080/enti/42')).toBe(42)
    expect(idDaLocation('/enti/42/')).toBe(42)
  })

  it('restituisce null se l\'header manca o non è di un ente', () => {
    expect(idDaLocation(null)).toBeNull()
    expect(idDaLocation('')).toBeNull()
    expect(idDaLocation('/province/5')).toBeNull()
    expect(idDaLocation('/enti/abc')).toBeNull()
  })
})

describe('leggiRetryAfter', () => {
  const con = (valore) => ({ headers: new Headers(valore == null ? {} : { 'Retry-After': valore }) })

  it('legge i secondi', () => {
    expect(leggiRetryAfter(con('60'))).toBe(60)
    expect(leggiRetryAfter(con('0'))).toBe(0)
  })

  it('ignora un header assente o in forma di data', () => {
    expect(leggiRetryAfter(con(null))).toBeNull()
    expect(leggiRetryAfter(con('Wed, 21 Oct 2026 07:28:00 GMT'))).toBeNull()
  })
})
