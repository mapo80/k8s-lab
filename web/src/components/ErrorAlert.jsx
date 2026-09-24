/**
 * Mostra un errore dell'API (ApiError, cioè un ProblemDetail) o un messaggio
 * semplice. Il titolo esplicito vince; poi il title del ProblemDetail; poi un
 * titolo in base allo stato. Il testo è il detail del server.
 */
const TITOLI = {
  0: 'Server non raggiungibile',
  400: 'Richiesta non valida',
  404: 'Non trovato',
  409: 'Conflitto',
  503: 'Servizio non disponibile',
}

export default function ErrorAlert({ error, title, children }) {
  if (!error) return null

  const titolo = title || error.title || TITOLI[error.status] || 'Si è verificato un errore'
  const messaggio = error.detail || error.message || 'Errore sconosciuto'

  return (
    <div
      role="alert"
      data-testid="error-alert"
      data-status={error.status}
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm"
    >
      <p className="font-semibold">{titolo}</p>
      <p className="text-sm text-rose-700">{messaggio}</p>
      {children}
    </div>
  )
}
