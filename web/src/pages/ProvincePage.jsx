import { Link } from 'react-router-dom'
import { getProvince } from '../api/impiantiApi'
import ErrorAlert from '../components/ErrorAlert'
import Spinner from '../components/Spinner'
import StatoVuoto from '../components/StatoVuoto'
import { useRichiesta } from '../hooks/useRichiesta'

export default function ProvincePage() {
  const { dati: province, errore } = useRichiesta(getProvince, 'province')

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Province</h1>
        <p className="mt-1 text-slate-500">Le sei province pugliesi: scegline una per vederne gli enti.</p>
      </div>

      {errore && <ErrorAlert error={errore} title="Impossibile caricare le province" />}
      {!province && !errore && <Spinner label="Carico le province..." />}
      {province?.length === 0 && <StatoVuoto titolo="Nessuna provincia" />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="elenco-province">
        {province?.map((provincia) => (
          <Link
            key={provincia.id}
            to={`/province/${provincia.id}`}
            data-testid="provincia-card"
            data-provincia-id={provincia.id}
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-lg"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Provincia n. {provincia.id}</p>
              <p className="text-lg font-semibold text-slate-900">{provincia.nome}</p>
            </div>
            <span className="text-emerald-700 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
