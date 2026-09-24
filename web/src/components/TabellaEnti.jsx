import { Link } from 'react-router-dom'
import { COLONNE } from '../utils/colonne'
import { etichettaTipo, oTrattino } from '../utils/formato'

export default function TabellaEnti({ enti, colonne = COLONNE, ordinamento, onOrdina }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm" data-testid="tabella-enti">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {colonne.map((colonna) => (
              <Intestazione key={colonna.id} colonna={colonna} ordinamento={ordinamento} onOrdina={onOrdina} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {enti.map((ente) => (
            <tr key={ente.id} data-testid="riga-ente" data-ente-id={ente.id} className="hover:bg-emerald-50/40">
              {colonne.map((colonna) => (
                <td key={colonna.id} className="px-4 py-3 text-slate-700" data-colonna={colonna.id}>
                  <Cella colonna={colonna} ente={ente} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cella({ colonna, ente }) {
  if (colonna.id === 'denominazione') {
    return (
      <Link to={`/enti/${ente.id}`} className="font-medium text-emerald-800 hover:underline" data-testid="link-ente">
        {ente.denominazione}
      </Link>
    )
  }
  if (colonna.id === 'tipo') return etichettaTipo(ente.tipo)
  return oTrattino(ente[colonna.id])
}

function Intestazione({ colonna, ordinamento, onOrdina }) {
  if (!colonna.campo) {
    return <th scope="col" className="px-4 py-3">{colonna.titolo}</th>
  }
  const attivo = ordinamento?.campo === colonna.campo
  const crescente = ordinamento?.direzione === 'asc'
  const ariaSort = attivo ? (crescente ? 'ascending' : 'descending') : 'none'
  return (
    <th scope="col" className="px-4 py-3" aria-sort={ariaSort}>
      <button
        type="button"
        data-testid={`ordina-${colonna.id}`}
        onClick={() => onOrdina(colonna.campo)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-emerald-700 ${attivo ? 'text-emerald-700' : ''}`}
        title={`Ordina per ${colonna.titolo.toLowerCase()}`}
      >
        {colonna.titolo}
        <span aria-hidden="true" className={attivo ? '' : 'opacity-30'}>
          {attivo && !crescente ? '▼' : '▲'}
        </span>
      </button>
    </th>
  )
}
