/** Dati di prova con la stessa forma delle risposte del backend. */

export const EUROPA_PARK = {
  id: 1,
  idSorgente: '13436',
  denominazione: 'EUROPA PARK HOTEL',
  tipo: 'PRIVATO',
  provincia: 'Taranto',
  comune: 'Ginosa',
  indirizzo: 'VIA DELLA CHIESA',
  telefono: null,
}

export const COMUNE_CORATO = {
  id: 136,
  idSorgente: '12569',
  denominazione: 'Comune di Corato',
  tipo: 'PUBBLICO',
  provincia: 'Bari',
  comune: 'Corato',
  indirizzo: 'Piazza Marconi, 12',
  telefono: '0809592111',
}

export const PROVINCE = [
  { id: 1, nome: 'Bari' },
  { id: 2, nome: 'Barletta-Andria-Trani' },
  { id: 3, nome: 'Brindisi' },
  { id: 4, nome: 'Foggia' },
  { id: 5, nome: 'Lecce' },
  { id: 6, nome: 'Taranto' },
]

export function pagina(contenuto, { pagina: numero = 0, dimensione = 20, totaleElementi, totalePagine } = {}) {
  const totale = totaleElementi ?? contenuto.length
  return {
    contenuto,
    pagina: numero,
    dimensione,
    totaleElementi: totale,
    totalePagine: totalePagine ?? Math.ceil(totale / dimensione),
  }
}

export const PAGINA_VUOTA = pagina([])

/** Una promessa che non si risolve mai: la pagina resta in caricamento. */
export const maiRisolta = () => new Promise(() => {})
