import { useEffect, useRef, useState } from 'react'

/**
 * Esegue una richiesta all'API ogni volta che cambia la chiave (per esempio
 * "5|0|20|denominazione,asc") e ne restituisce lo stato:
 * { dati, errore, caricamento }.
 *
 * Il caricamento non è uno stato a sé: la richiesta è in corso finché la
 * risposta arrivata non è quella della chiave attuale. Mentre arriva la pagina
 * successiva i dati della precedente restano, così la tabella non sparisce a
 * ogni clic; una risposta arrivata tardi, per una chiave vecchia, si ignora.
 */
export function useRichiesta(carica, chiave) {
  // la funzione può essere una nuova arrow a ogni render: decide la chiave
  const caricaAttuale = useRef(carica)
  useEffect(() => {
    caricaAttuale.current = carica
  })

  const [risposta, setRisposta] = useState({ chiave: null, dati: null, errore: null })

  useEffect(() => {
    let superata = false
    caricaAttuale.current().then(
      (dati) => !superata && setRisposta({ chiave, dati, errore: null }),
      (errore) => !superata && setRisposta({ chiave, dati: null, errore }),
    )
    return () => {
      superata = true
    }
  }, [chiave])

  const caricamento = risposta.chiave !== chiave
  return { dati: risposta.dati, errore: caricamento ? null : risposta.errore, caricamento }
}
