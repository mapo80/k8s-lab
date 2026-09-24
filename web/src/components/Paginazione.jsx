import { DIMENSIONI } from '../utils/paginazione'
import { formattaNumero } from '../utils/formato'

/**
 * Navigazione fra le pagine e scelta della dimensione. La pagina è quella del
 * backend, da 0; all'utente si mostra da 1.
 */
export default function Paginazione({ pagina, totalePagine, totaleElementi, dimensione, onPagina, onDimensione }) {
  const primaPagina = pagina <= 0
  const ultimaPagina = pagina >= totalePagine - 1
  // una dimensione scritta a mano nell'URL (per esempio 37) resta selezionabile
  const dimensioni = DIMENSIONI.includes(dimensione)
    ? DIMENSIONI
    : [...DIMENSIONI, dimensione].sort((a, b) => a - b)

  return (
    <div
      data-testid="paginazione"
      className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
    >
      <p data-testid="riepilogo-pagina">
        Pagina <strong>{formattaNumero(Math.min(pagina + 1, Math.max(totalePagine, 1)))}</strong> di{' '}
        <strong>{formattaNumero(Math.max(totalePagine, 1))}</strong> ·{' '}
        <span data-testid="totale-elementi">{formattaNumero(totaleElementi)}</span> enti
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span>Per pagina</span>
          <select
            data-testid="dimensione-select"
            value={dimensione}
            onChange={(e) => onDimensione(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1"
          >
            {dimensioni.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <div className="flex gap-1">
          <Pulsante testid="pagina-prima" disabled={primaPagina} onClick={() => onPagina(0)} label="Prima pagina">«</Pulsante>
          <Pulsante testid="pagina-precedente" disabled={primaPagina} onClick={() => onPagina(pagina - 1)} label="Pagina precedente">‹ Precedente</Pulsante>
          <Pulsante testid="pagina-successiva" disabled={ultimaPagina} onClick={() => onPagina(pagina + 1)} label="Pagina successiva">Successiva ›</Pulsante>
          <Pulsante testid="pagina-ultima" disabled={ultimaPagina} onClick={() => onPagina(totalePagine - 1)} label="Ultima pagina">»</Pulsante>
        </div>
      </div>
    </div>
  )
}

function Pulsante({ testid, disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
