import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRichiesta } from '../hooks/useRichiesta'
import { aggiornaParametri, leggiParametri, prossimoOrdinamento, scriviOrdinamento } from '../utils/paginazione'
import ErrorAlert from './ErrorAlert'
import Paginazione from './Paginazione'
import Spinner from './Spinner'
import StatoVuoto from './StatoVuoto'
import TabellaEnti from './TabellaEnti'
import { COLONNE } from '../utils/colonne'

/**
 * Un elenco di enti paginato e ordinabile, con pagina, dimensione e
 * ordinamento nell'URL. Lo usano l'elenco generale e quello di una provincia:
 * cambia solo la funzione che carica la pagina.
 *
 * carica({ page, size, sort }) restituisce una Pagina del backend:
 * { contenuto, pagina, dimensione, totaleElementi, totalePagine }.
 */
export default function ElencoEnti({ carica, chiave = '', colonne = COLONNE, vuoto, titoloErrore }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const campiOrdinabili = colonne.filter((c) => c.campo).map((c) => c.campo)
  const { page, size, sort, ordinamento } = leggiParametri(searchParams, campiOrdinabili)
  const { dati, errore, caricamento } = useRichiesta(
    () => carica({ page, size, sort }),
    [chiave, page, size, sort].join('|'),
  )

  // React Router aggiorna l'URL dentro una transizione di React: un'azione fatta
  // subito dopo un'altra (ordina, poi cambia dimensione) vedrebbe ancora i
  // parametri di prima, e cancellerebbe la prima modifica. Per questo si parte
  // sempre dagli ultimi parametri scritti, non da quelli dell'ultimo render.
  // L'effetto riallinea il riferimento quando l'URL cambia da fuori (indietro).
  const ultimiParametri = useRef(searchParams)
  useEffect(() => {
    ultimiParametri.current = searchParams
  }, [searchParams])
  const vaiA = (modifiche) => {
    const nuovi = aggiornaParametri(ultimiParametri.current, modifiche)
    ultimiParametri.current = nuovi
    setSearchParams(nuovi)
  }

  if (errore) return <ErrorAlert error={errore} title={titoloErrore?.(errore)} />
  if (!dati) return <Spinner label="Carico gli enti..." />

  if (dati.totaleElementi === 0) return vuoto

  return (
    <div aria-busy={caricamento} data-testid="elenco-enti">
      {dati.contenuto.length === 0 ? (
        <StatoVuoto titolo={`La pagina ${page + 1} non esiste`}>
          <p>Gli enti stanno su {dati.totalePagine} pagine da {dati.dimensione}.</p>
          <button
            type="button"
            data-testid="vai-ultima-pagina"
            onClick={() => vaiA({ page: dati.totalePagine - 1 })}
            className="mt-4 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Vai all'ultima pagina
          </button>
        </StatoVuoto>
      ) : (
        <div className={caricamento ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <TabellaEnti
            enti={dati.contenuto}
            colonne={colonne}
            ordinamento={ordinamento}
            onOrdina={(campo) => vaiA({ sort: scriviOrdinamento(prossimoOrdinamento(ordinamento, campo)) })}
          />
        </div>
      )}
      <Paginazione
        pagina={page}
        totalePagine={dati.totalePagine}
        totaleElementi={dati.totaleElementi}
        dimensione={size}
        onPagina={(nuova) => vaiA({ page: nuova })}
        onDimensione={(nuova) => vaiA({ size: nuova })}
      />
    </div>
  )
}
