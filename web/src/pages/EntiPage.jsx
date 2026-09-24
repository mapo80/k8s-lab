import { Link } from 'react-router-dom'
import { getEnti } from '../api/impiantiApi'
import ElencoEnti from '../components/ElencoEnti'
import StatoVuoto from '../components/StatoVuoto'

export default function EntiPage() {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enti proprietari di impianti sportivi</h1>
          <p className="mt-1 text-slate-500">
            Dall'open data della Regione Puglia. Clicca su una colonna per ordinare, su un nome per il dettaglio.
          </p>
        </div>
        <Link
          to="/enti/nuovo"
          data-testid="link-nuovo-ente"
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          + Nuovo ente
        </Link>
      </div>

      <ElencoEnti
        carica={getEnti}
        titoloErrore={() => 'Impossibile caricare gli enti'}
        vuoto={
          <StatoVuoto titolo="Non ci sono ancora enti">
            <p>
              Lancia l'<Link to="/importazione" className="font-medium text-emerald-700 underline" data-testid="vuoto-link-import">importazione dall'open data</Link>{' '}
              oppure <Link to="/enti/nuovo" className="font-medium text-emerald-700 underline">crea un ente</Link> a mano.
            </p>
          </StatoVuoto>
        }
      />
    </section>
  )
}
