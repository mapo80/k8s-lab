import { Link, useParams } from 'react-router-dom'
import { getEntiDellaProvincia, getProvince } from '../api/impiantiApi'
import ElencoEnti from '../components/ElencoEnti'
import StatoVuoto from '../components/StatoVuoto'
import { COLONNE } from '../utils/colonne'
import { useRichiesta } from '../hooks/useRichiesta'

// la provincia è la stessa per tutte le righe: la colonna non serve
const COLONNE_PROVINCIA = COLONNE.filter((colonna) => colonna.id !== 'provincia')

export default function ProvinciaEntiPage() {
  const { id } = useParams()
  // il backend non ha GET /province/{id}: il nome si prende dall'elenco
  const { dati: province } = useRichiesta(getProvince, 'province')
  const nome = province?.find((provincia) => String(provincia.id) === id)?.nome

  return (
    <section>
      <Link to="/province" className="text-sm font-medium text-emerald-700 hover:underline" data-testid="torna-province">
        ← Tutte le province
      </Link>
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="titolo-provincia">
          {nome ? `Enti della provincia di ${nome}` : `Enti della provincia n. ${id}`}
        </h1>
      </div>

      <ElencoEnti
        carica={(paginazione) => getEntiDellaProvincia(id, paginazione)}
        chiave={id}
        colonne={COLONNE_PROVINCIA}
        titoloErrore={(errore) => (errore.status === 404 ? 'Provincia non trovata' : 'Impossibile caricare gli enti')}
        vuoto={
          <StatoVuoto titolo="Nessun ente in questa provincia">
            <p>
              Se non hai ancora importato i dati, lancia l'
              <Link to="/importazione" className="font-medium text-emerald-700 underline">importazione dall'open data</Link>.
            </p>
          </StatoVuoto>
        }
      />
    </section>
  )
}
