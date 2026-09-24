import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { creaEnte, getProvince } from '../api/impiantiApi'
import ErrorAlert from '../components/ErrorAlert'
import { useRichiesta } from '../hooks/useRichiesta'
import { TIPI_ENTE } from '../utils/formato'
import { ENTE_VUOTO, LUNGHEZZE_MASSIME, corpoRichiesta, erroriDelServer, validaEnte } from '../utils/validazioneEnte'

const CAMPI_DEL_FORM = Object.keys(ENTE_VUOTO)

const TITOLI_ERRORE = {
  400: 'Il server ha rifiutato alcuni campi',
  404: 'La provincia scelta non esiste',
  409: 'idSorgente già presente',
}

/**
 * Crea un ente con POST /enti. La validazione lato client usa le stesse regole
 * del backend; gli errori che arrivano comunque dal server (400 con i campi,
 * 409 sull'idSorgente, 404 sulla provincia) si mostrano accanto ai campi.
 */
export default function NuovoEntePage() {
  const navigate = useNavigate()
  const { dati: province, errore: erroreProvince } = useRichiesta(getProvince, 'province')

  const [valori, setValori] = useState(ENTE_VUOTO)
  const [erroriClient, setErroriClient] = useState({})
  const [erroriServer, setErroriServer] = useState({})
  const [erroreInvio, setErroreInvio] = useState(null)
  const [tentato, setTentato] = useState(false)
  const [inInvio, setInInvio] = useState(false)

  function cambia(campo, valore) {
    const nuovi = { ...valori, [campo]: valore }
    setValori(nuovi)
    // dopo il primo invio gli errori si aggiornano mentre si scrive
    if (tentato) setErroriClient(validaEnte(nuovi))
    // l'errore del server su un campo non vale più quando il campo cambia
    if (erroriServer[campo]) {
      const rimanenti = { ...erroriServer }
      delete rimanenti[campo]
      setErroriServer(rimanenti)
    }
  }

  async function invia(evento) {
    evento.preventDefault()
    setTentato(true)
    const errori = validaEnte(valori)
    setErroriClient(errori)
    if (Object.keys(errori).length > 0) return

    setInInvio(true)
    setErroreInvio(null)
    setErroriServer({})
    try {
      const { id } = await creaEnte(corpoRichiesta(valori))
      navigate(id != null ? `/enti/${id}` : '/enti', { state: { creato: true } })
    } catch (errore) {
      setErroreInvio(errore)
      if (errore.status === 400) {
        setErroriServer(erroriDelServer(errore.errori))
      } else if (errore.status === 409) {
        setErroriServer({ idSorgente: errore.detail || 'Esiste già un ente con questo idSorgente' })
      } else if (errore.status === 404) {
        setErroriServer({ provinciaId: 'Provincia inesistente: ricarica la pagina e sceglila di nuovo' })
      }
      setInInvio(false)
    }
  }

  const errore = (campo) => erroriClient[campo] ?? erroriServer[campo]
  // i campi in errore che il form non ha: si elencano nel riquadro in alto
  const erroriFuoriDalForm = (erroreInvio?.errori ?? []).filter((e) => !CAMPI_DEL_FORM.includes(e.campo))

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nuovo ente</h1>
        <p className="mt-1 text-slate-500">
          I campi con * sono obbligatori. Spazi in testa e in coda, e gli spazi del telefono, li toglie il server.
        </p>
      </div>

      {erroreInvio && (
        <div className="mb-6">
          <ErrorAlert error={erroreInvio} title={TITOLI_ERRORE[erroreInvio.status]}>
            {erroriFuoriDalForm.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {erroriFuoriDalForm.map((e) => (
                  <li key={e.campo}>{e.campo}: {e.messaggio}</li>
                ))}
              </ul>
            )}
          </ErrorAlert>
        </div>
      )}
      {erroreProvince && (
        <div className="mb-6">
          <ErrorAlert error={erroreProvince} title="Impossibile caricare le province" />
        </div>
      )}

      <form
        noValidate
        onSubmit={invia}
        data-testid="form-ente"
        className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <Campo nome="idSorgente" etichetta="Id nell'open data" obbligatorio errore={errore('idSorgente')}
          aiuto="Univoco: lo stesso identificativo usato dall'importazione.">
          {(props) => <input {...props} value={valori.idSorgente} onChange={(e) => cambia('idSorgente', e.target.value)} />}
        </Campo>

        <Campo nome="tipo" etichetta="Tipo" obbligatorio errore={errore('tipo')}>
          {(props) => (
            <select {...props} value={valori.tipo} onChange={(e) => cambia('tipo', e.target.value)}>
              <option value="">Scegli il tipo...</option>
              {TIPI_ENTE.map((tipo) => (
                <option key={tipo.valore} value={tipo.valore}>{tipo.etichetta}</option>
              ))}
            </select>
          )}
        </Campo>

        <Campo nome="denominazione" etichetta="Denominazione" obbligatorio errore={errore('denominazione')} largo>
          {(props) => <input {...props} value={valori.denominazione} onChange={(e) => cambia('denominazione', e.target.value)} />}
        </Campo>

        <Campo nome="provinciaId" etichetta="Provincia" obbligatorio errore={errore('provinciaId')}>
          {(props) => (
            <select {...props} value={valori.provinciaId} disabled={!province}
              onChange={(e) => cambia('provinciaId', e.target.value)}>
              <option value="">{province ? 'Scegli la provincia...' : 'Carico le province...'}</option>
              {province?.map((provincia) => (
                <option key={provincia.id} value={provincia.id}>{provincia.nome}</option>
              ))}
            </select>
          )}
        </Campo>

        <Campo nome="comune" etichetta="Comune" obbligatorio errore={errore('comune')}>
          {(props) => <input {...props} value={valori.comune} onChange={(e) => cambia('comune', e.target.value)} />}
        </Campo>

        <Campo nome="indirizzo" etichetta="Indirizzo" errore={errore('indirizzo')} largo>
          {(props) => <input {...props} value={valori.indirizzo} onChange={(e) => cambia('indirizzo', e.target.value)} />}
        </Campo>

        <Campo nome="telefono" etichetta="Telefono" errore={errore('telefono')}
          aiuto="Testo, non numero: punti, barre e trattini restano.">
          {(props) => <input {...props} type="tel" value={valori.telefono} onChange={(e) => cambia('telefono', e.target.value)} />}
        </Campo>

        <div className="flex items-center justify-end gap-3 sm:col-span-2">
          <button
            type="submit"
            data-testid="salva-ente"
            disabled={inInvio}
            className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {inInvio ? 'Salvataggio...' : 'Crea ente'}
          </button>
        </div>
      </form>
    </section>
  )
}

/** Etichetta, controllo ed errore di un campo. Il controllo lo passa chi usa il componente. */
function Campo({ nome, etichetta, obbligatorio = false, errore, aiuto, largo = false, children }) {
  const idErrore = `errore-${nome}`
  const idAiuto = `aiuto-${nome}`
  const massimo = LUNGHEZZE_MASSIME[nome]
  const props = {
    id: nome,
    name: nome,
    'data-testid': `campo-${nome}`,
    'aria-invalid': errore ? 'true' : 'false',
    'aria-required': obbligatorio ? 'true' : undefined,
    'aria-describedby': [errore && idErrore, aiuto && idAiuto].filter(Boolean).join(' ') || undefined,
    className: [
      'w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2',
      errore ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-emerald-200',
    ].join(' '),
  }
  return (
    <div className={largo ? 'sm:col-span-2' : ''}>
      <label htmlFor={nome} className="mb-1 block text-sm font-medium text-slate-700">
        {etichetta}{obbligatorio && ' *'}
        {massimo && <span className="ml-1 font-normal text-slate-400">(max {massimo})</span>}
      </label>
      {children(props)}
      {aiuto && <p id={idAiuto} className="mt-1 text-xs text-slate-500">{aiuto}</p>}
      {errore && (
        <p id={idErrore} data-testid={idErrore} className="mt-1 text-sm text-rose-700">{errore}</p>
      )}
    </div>
  )
}
