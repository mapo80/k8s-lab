/**
 * L'unico modulo che parla con il backend.
 *
 * Il browser chiama /api/...: in sviluppo il proxy di Vite, in produzione
 * nginx, inoltrano al backend togliendo il prefisso.
 */
const BASE_URL = '/api'

/**
 * Un errore dell'API. Il backend risponde con un ProblemDetail (RFC 9457):
 * title, detail, status e, nei 400, errori: [{ campo, messaggio }].
 * status 0 vuol dire che il server non ha risposto affatto.
 */
export class ApiError extends Error {
  constructor(status, problema = null, retryAfter = null) {
    super(problema?.detail || problema?.title || messaggioPerStato(status))
    this.name = 'ApiError'
    this.status = status
    this.title = problema?.title ?? null
    this.detail = problema?.detail ?? null
    this.errori = Array.isArray(problema?.errori) ? problema.errori : []
    this.retryAfter = retryAfter
  }
}

function messaggioPerStato(status) {
  if (status === 0) return 'Il server non risponde: controlla che il backend sia avviato.'
  return `Richiesta fallita (HTTP ${status})`
}

/** Il corpo di errore, se è JSON (application/json o application/problem+json); altrimenti null. */
export async function leggiProblema(response) {
  const tipo = response.headers?.get('Content-Type') ?? ''
  if (!tipo.includes('json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

/** Retry-After in secondi, se il server l'ha mandato come numero (il backend manda 60 sul 503). */
export function leggiRetryAfter(response) {
  const valore = response.headers?.get('Retry-After')
  if (valore == null || valore.trim() === '') return null
  const secondi = Number(valore)
  return Number.isInteger(secondi) && secondi >= 0 ? secondi : null
}

/** L'id del nuovo ente dall'header Location (/enti/42, relativo o assoluto); null se non c'è. */
export function idDaLocation(location) {
  if (!location) return null
  const trovato = /\/enti\/(\d+)\/?$/.exec(location)
  return trovato ? Number(trovato[1]) : null
}

async function richiesta(percorso, opzioni) {
  let response
  try {
    response = await fetch(`${BASE_URL}${percorso}`, opzioni)
  } catch {
    // fetch rifiuta solo se la richiesta non parte o non arriva risposta
    throw new ApiError(0)
  }
  if (!response.ok) {
    throw new ApiError(response.status, await leggiProblema(response), leggiRetryAfter(response))
  }
  return response
}

async function json(percorso, opzioni) {
  const response = await richiesta(percorso, opzioni)
  return response.json()
}

/**
 * La query string di paginazione: page (da 0), size e sort ("campo,direzione").
 * I parametri assenti non si mandano: decide il default del backend
 * (20 per pagina, denominazione crescente).
 *
 * A parità del campo scelto l'ordine fra le righe non è definito (40
 * denominazioni si ripetono): senza un secondo criterio una riga potrebbe
 * comparire in due pagine e un'altra in nessuna. Per questo si aggiunge
 * sempre id crescente come spareggio.
 */
export function queryPaginazione({ page, size, sort } = {}) {
  const parametri = new URLSearchParams()
  if (page != null) parametri.set('page', String(page))
  if (size != null) parametri.set('size', String(size))
  if (sort) {
    parametri.append('sort', sort)
    if (!sort.startsWith('id,')) parametri.append('sort', 'id,asc')
  }
  const query = parametri.toString()
  return query ? `?${query}` : ''
}

/** GET /enti?page=&size=&sort= */
export function getEnti(paginazione) {
  return json(`/enti${queryPaginazione(paginazione)}`)
}

/** GET /enti/{id} */
export function getEnte(id) {
  return json(`/enti/${encodeURIComponent(id)}`)
}

/** GET /province: sono sei, si chiedono tutte in una pagina, ordinate per nome. */
export async function getProvince() {
  const pagina = await json(`/province${queryPaginazione({ size: 100, sort: 'nome,asc' })}`)
  return pagina.contenuto
}

/** GET /province/{id}/enti?page=&size=&sort= */
export function getEntiDellaProvincia(id, paginazione) {
  return json(`/province/${encodeURIComponent(id)}/enti${queryPaginazione(paginazione)}`)
}

/**
 * POST /enti. Restituisce { id, ente }: l'id si legge dall'header Location,
 * come vuole il 201 Created; se mancasse, si usa quello del corpo.
 */
export async function creaEnte(dati) {
  const response = await richiesta('/enti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  })
  const ente = await response.json()
  const id = idDaLocation(response.headers.get('Location')) ?? ente?.id ?? null
  return { id, ente }
}

/** POST /import/enti: { inseriti, giaPresenti, scartati }. Dura qualche secondo. */
export function importaEnti() {
  return json('/import/enti', { method: 'POST' })
}
