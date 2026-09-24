// in italiano CLDR non raggruppa i numeri di quattro cifre (1739): si forza 1.739
const numeri = new Intl.NumberFormat('it-IT', { useGrouping: 'always' })

/** 1739 -> "1.739" */
export function formattaNumero(valore) {
  if (valore == null || Number.isNaN(Number(valore))) return '—'
  return numeri.format(valore)
}

/** Un campo facoltativo assente (indirizzo, telefono) si mostra come trattino. */
export function oTrattino(valore) {
  return valore == null || String(valore).trim() === '' ? '—' : valore
}

export const TIPI_ENTE = [
  { valore: 'PRIVATO', etichetta: 'Privato' },
  { valore: 'PUBBLICO', etichetta: 'Pubblico' },
]

/** PRIVATO -> "Privato"; un valore sconosciuto si mostra com'è. */
export function etichettaTipo(valore) {
  return TIPI_ENTE.find((tipo) => tipo.valore === valore)?.etichetta ?? valore
}
