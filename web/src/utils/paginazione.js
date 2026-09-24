/**
 * Pagina, dimensione e ordinamento stanno nell'URL con gli stessi nomi e lo
 * stesso significato dei parametri del backend: page (da 0), size, sort
 * ("campo,asc" o "campo,desc"). Un link si può condividere o ricaricare e
 * mostra la stessa pagina.
 */

export const DIMENSIONE_PREDEFINITA = 20
export const DIMENSIONE_MASSIMA = 100
export const DIMENSIONI = [10, 20, 50, 100]
export const ORDINAMENTO_PREDEFINITO = { campo: 'denominazione', direzione: 'asc' }

function intero(valore) {
  if (valore == null || !/^\d+$/.test(valore)) return null
  return Number(valore)
}

/** "comune,desc" -> { campo: 'comune', direzione: 'desc' }; null se non è fra i campi ammessi. */
export function leggiOrdinamento(valore, campiAmmessi) {
  if (!valore) return null
  const [campo, direzione = 'asc'] = valore.split(',')
  const dir = direzione.toLowerCase()
  if (!campiAmmessi.includes(campo) || (dir !== 'asc' && dir !== 'desc')) return null
  return { campo, direzione: dir }
}

export function scriviOrdinamento({ campo, direzione }) {
  return `${campo},${direzione}`
}

/**
 * I parametri dell'URL, ripuliti: un valore non valido torna al default
 * invece di finire al backend e tornare indietro come 400. La dimensione è
 * limitata a 100, lo stesso tetto del backend.
 */
export function leggiParametri(searchParams, campiAmmessi) {
  const page = intero(searchParams.get('page')) ?? 0
  const richiesta = intero(searchParams.get('size'))
  const size = richiesta == null || richiesta < 1
    ? DIMENSIONE_PREDEFINITA
    : Math.min(richiesta, DIMENSIONE_MASSIMA)
  const ordinamento = leggiOrdinamento(searchParams.get('sort'), campiAmmessi) ?? ORDINAMENTO_PREDEFINITO
  return { page, size, ordinamento, sort: scriviOrdinamento(ordinamento) }
}

/**
 * Il clic su una colonna: sulla colonna già ordinata inverte la direzione,
 * su un'altra colonna parte dal crescente.
 */
export function prossimoOrdinamento(corrente, campo) {
  if (corrente.campo === campo) {
    return { campo, direzione: corrente.direzione === 'asc' ? 'desc' : 'asc' }
  }
  return { campo, direzione: 'asc' }
}

/**
 * I nuovi parametri dell'URL a partire da quelli attuali. Cambiare dimensione
 * o ordinamento riporta alla prima pagina: la pagina 5 da 20 righe non è la
 * pagina 5 da 100.
 */
export function aggiornaParametri(searchParams, modifiche) {
  const nuovi = new URLSearchParams(searchParams)
  if ('size' in modifiche || 'sort' in modifiche) nuovi.set('page', '0')
  for (const [chiave, valore] of Object.entries(modifiche)) {
    nuovi.set(chiave, String(valore))
  }
  return nuovi
}
