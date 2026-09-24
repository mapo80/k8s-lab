import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getEnte } from '../api/impiantiApi'
import ErrorAlert from '../components/ErrorAlert'
import Spinner from '../components/Spinner'
import { useRichiesta } from '../hooks/useRichiesta'
import { etichettaTipo, oTrattino } from '../utils/formato'

const TITOLI_ERRORE = {
  404: 'Ente non trovato',
  400: 'Id non valido',
}

export default function EnteDettaglioPage() {
  const { id } = useParams()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const { dati: ente, errore, caricamento } = useRichiesta(() => getEnte(id), id)

  // Il form arriva qui con state.creato. Lo stato della cronologia sopravvive
  // al ricaricamento della pagina: si ricorda nel componente, per quale ente,
  // e si toglie dalla cronologia, così ricaricando il messaggio non ricompare.
  const [creato] = useState(state?.creato ? id : null)
  useEffect(() => {
    if (state?.creato) navigate(pathname, { replace: true, state: null })
  }, [state, pathname, navigate])

  return (
    <section>
      <Link to="/enti" className="text-sm font-medium text-emerald-700 hover:underline" data-testid="torna-elenco">
        ← Tutti gli enti
      </Link>

      <div className="mt-4">
        {errore && <ErrorAlert error={errore} title={TITOLI_ERRORE[errore.status] ?? 'Impossibile caricare l\'ente'} />}
        {caricamento && !errore && <Spinner label="Carico l'ente..." />}
        {ente && !caricamento && (
          <>
            {creato === id && (
              <div
                data-testid="ente-creato"
                role="status"
                className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
              >
                Ente creato. Il server ha normalizzato i valori: ecco come sono stati salvati.
              </div>
            )}
            <SchedaEnte ente={ente} />
          </>
        )}
      </div>
    </section>
  )
}

function SchedaEnte({ ente }) {
  const righe = [
    ['id', 'Id', ente.id],
    ['idSorgente', 'Id nell\'open data', ente.idSorgente],
    ['tipo', 'Tipo', etichettaTipo(ente.tipo)],
    ['provincia', 'Provincia', ente.provincia],
    ['comune', 'Comune', ente.comune],
    ['indirizzo', 'Indirizzo', oTrattino(ente.indirizzo)],
    ['telefono', 'Telefono', oTrattino(ente.telefono)],
  ]
  return (
    <article data-testid="dettaglio-ente" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-6 text-white">
        <p className="text-sm uppercase tracking-wide text-emerald-100">{etichettaTipo(ente.tipo)} · {ente.provincia}</p>
        <h1 className="mt-1 text-2xl font-bold" data-testid="dettaglio-denominazione">{ente.denominazione}</h1>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-6 py-6 sm:grid-cols-2">
        {righe.map(([chiave, etichetta, valore]) => (
          <div key={chiave}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etichetta}</dt>
            <dd className="mt-1 text-slate-900" data-testid={`dettaglio-${chiave}`}>{valore}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
