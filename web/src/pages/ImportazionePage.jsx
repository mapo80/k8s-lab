import { useState } from 'react'
import { Link } from 'react-router-dom'
import { importaEnti } from '../api/impiantiApi'
import ErrorAlert from '../components/ErrorAlert'
import Spinner from '../components/Spinner'
import { formattaNumero } from '../utils/formato'

/**
 * Lancia POST /import/enti e ne mostra l'esito. L'importazione è idempotente:
 * rilanciata non crea duplicati, e gli enti tornano come «già presenti».
 */
export default function ImportazionePage() {
  const [inCorso, setInCorso] = useState(false)
  const [esito, setEsito] = useState(null)
  const [errore, setErrore] = useState(null)

  async function importa() {
    setInCorso(true)
    setEsito(null)
    setErrore(null)
    try {
      setEsito(await importaEnti())
    } catch (e) {
      setErrore(e)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Importazione dall'open data</h1>
        <p className="mt-1 text-slate-500">
          Scarica l'elenco degli enti dal portale della Regione Puglia e salva quelli nuovi. Si può rilanciare:
          gli enti già salvati si riconoscono dall'id dell'open data e non si duplicano.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          data-testid="avvia-import"
          onClick={importa}
          disabled={inCorso}
          className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
        >
          {inCorso ? 'Importazione in corso...' : 'Importa gli enti'}
        </button>

        {inCorso && <Spinner label="Scarico e salvo gli enti: può richiedere qualche secondo..." />}

        {errore && (
          <div className="mt-6">
            {errore.status === 503 ? (
              <ErrorAlert error={errore} title="La sorgente open data non risponde">
                <p className="mt-1 text-sm text-rose-700" data-testid="riprova-tra">
                  {errore.retryAfter != null
                    ? `Riprova tra ${errore.retryAfter} secondi: nessun ente è stato modificato.`
                    : 'Riprova più tardi: nessun ente è stato modificato.'}
                </p>
              </ErrorAlert>
            ) : (
              <ErrorAlert error={errore} title="Importazione non riuscita" />
            )}
          </div>
        )}

        {esito && <Esito esito={esito} />}
      </div>
    </section>
  )
}

function Esito({ esito }) {
  const contatori = [
    { id: 'inseriti', etichetta: 'Inseriti', valore: esito.inseriti, colore: 'text-emerald-700' },
    { id: 'gia-presenti', etichetta: 'Già presenti', valore: esito.giaPresenti, colore: 'text-sky-700' },
    { id: 'scartati', etichetta: 'Scartati', valore: esito.scartati, colore: 'text-amber-700' },
  ]
  return (
    <div data-testid="esito-import" className="mt-6" role="status">
      <p className="font-semibold text-slate-800" data-testid="esito-messaggio">
        {esito.inseriti > 0
          ? `Importazione completata: ${formattaNumero(esito.inseriti)} enti nuovi.`
          : 'Importazione completata: nessun ente nuovo, erano già tutti presenti.'}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-4">
        {contatori.map((c) => (
          <div key={c.id} className="rounded-xl bg-slate-50 px-4 py-4 text-center">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.etichetta}</dt>
            <dd className={`mt-1 text-3xl font-bold ${c.colore}`} data-testid={`esito-${c.id}`}>
              {formattaNumero(c.valore)}
            </dd>
          </div>
        ))}
      </dl>
      {esito.scartati > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Gli scartati sono record non importabili, per esempio senza id: nel file ce n'è uno, l'ultimo.
        </p>
      )}
      <Link to="/enti" data-testid="vai-elenco" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
        Vai all'elenco degli enti →
      </Link>
    </div>
  )
}
