import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation, useParams } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import NuovoEntePage from './NuovoEntePage'
import * as api from '../api/impiantiApi'
import { PROVINCE, maiRisolta } from '../test/dati'
import { posizione, renderPagina } from '../test/utils'

/** Al posto del dettaglio: mostra l'id e lo stato ricevuti con la navigazione. */
function DettaglioFinto() {
  const { id } = useParams()
  const { state } = useLocation()
  return <p data-testid="dettaglio-finto">ente {id}{state?.creato ? ', appena creato' : ''}</p>
}

function renderForm() {
  return renderPagina(<NuovoEntePage />, {
    percorso: '/enti/nuovo',
    rotta: '/enti/nuovo',
    altreRotte: { '/enti/:id': <DettaglioFinto /> },
  })
}

async function compila(user, valori = {}) {
  const completi = {
    idSorgente: '90001',
    denominazione: 'POLISPORTIVA SAN NICOLA',
    comune: 'Bari',
    indirizzo: 'VIA SPARANO 12',
    telefono: '080 5461291',
    ...valori,
  }
  await screen.findByRole('option', { name: 'Lecce' })
  for (const campo of ['idSorgente', 'denominazione', 'comune', 'indirizzo', 'telefono']) {
    if (completi[campo]) await user.type(screen.getByTestId(`campo-${campo}`), completi[campo])
  }
  await user.selectOptions(screen.getByTestId('campo-tipo'), valori.tipo ?? 'PRIVATO')
  await user.selectOptions(screen.getByTestId('campo-provinciaId'), valori.provinciaId ?? '1')
}

describe('NuovoEntePage', () => {
  it('la provincia si sceglie fra quelle di GET /province e il tipo fra PRIVATO e PUBBLICO', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    renderForm()

    await screen.findByRole('option', { name: 'Taranto' })
    const province = [...screen.getByTestId('campo-provinciaId').options].map((o) => [o.value, o.text])
    expect(province).toEqual([['', 'Scegli la provincia...'], ...PROVINCE.map((p) => [String(p.id), p.nome])])
    const tipi = [...screen.getByTestId('campo-tipo').options].map((o) => o.value)
    expect(tipi).toEqual(['', 'PRIVATO', 'PUBBLICO'])
  })

  it('mentre le province caricano la select è disabilitata', () => {
    vi.spyOn(api, 'getProvince').mockReturnValue(maiRisolta())
    renderForm()
    expect(screen.getByTestId('campo-provinciaId')).toBeDisabled()
    expect(screen.getByTestId('campo-provinciaId')).toHaveTextContent('Carico le province')
  })

  it('se le province non arrivano lo dice', async () => {
    vi.spyOn(api, 'getProvince').mockRejectedValue(new api.ApiError(0))
    renderForm()
    expect(await screen.findByTestId('error-alert')).toHaveTextContent('Impossibile caricare le province')
  })

  it('il form vuoto non parte: segnala i campi obbligatori senza chiamare il server', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    const crea = vi.spyOn(api, 'creaEnte')
    const user = userEvent.setup()
    renderForm()

    await screen.findByRole('option', { name: 'Lecce' })
    await user.click(screen.getByTestId('salva-ente'))

    for (const campo of ['idSorgente', 'denominazione', 'tipo', 'provinciaId', 'comune']) {
      expect(screen.getByTestId(`errore-${campo}`)).toBeInTheDocument()
      expect(screen.getByTestId(`campo-${campo}`)).toHaveAttribute('aria-invalid', 'true')
    }
    expect(screen.queryByTestId('errore-indirizzo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('errore-telefono')).not.toBeInTheDocument()
    expect(crea).not.toHaveBeenCalled()
  })

  it('segnala le lunghezze massime del backend', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    const crea = vi.spyOn(api, 'creaEnte')
    const user = userEvent.setup()
    renderForm()

    await compila(user, { idSorgente: 'x'.repeat(21), telefono: '1'.repeat(31) })
    await user.click(screen.getByTestId('salva-ente'))

    expect(screen.getByTestId('errore-idSorgente')).toHaveTextContent('Al massimo 20 caratteri (ora sono 21)')
    expect(screen.getByTestId('errore-telefono')).toHaveTextContent('Al massimo 30 caratteri (ora sono 31)')
    expect(crea).not.toHaveBeenCalled()
  })

  it('dopo il primo invio gli errori si aggiornano mentre si scrive', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    const user = userEvent.setup()
    renderForm()

    await screen.findByRole('option', { name: 'Lecce' })
    await user.click(screen.getByTestId('salva-ente'))
    expect(screen.getByTestId('errore-comune')).toBeInTheDocument()

    await user.type(screen.getByTestId('campo-comune'), 'Lecce')
    expect(screen.queryByTestId('errore-comune')).not.toBeInTheDocument()
  })

  it('crea l\'ente e va al suo dettaglio, con l\'id letto dal Location', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    const crea = vi.spyOn(api, 'creaEnte').mockResolvedValue({ id: 1741, ente: { id: 1741 } })
    const user = userEvent.setup()
    renderForm()

    await compila(user, { provinciaId: '5', tipo: 'PUBBLICO' })
    await user.click(screen.getByTestId('salva-ente'))

    expect(await screen.findByTestId('dettaglio-finto')).toHaveTextContent('ente 1741, appena creato')
    expect(posizione(screen)).toBe('/enti/1741')
    expect(crea).toHaveBeenCalledWith({
      idSorgente: '90001',
      denominazione: 'POLISPORTIVA SAN NICOLA',
      tipo: 'PUBBLICO',
      provinciaId: 5,
      comune: 'Bari',
      indirizzo: 'VIA SPARANO 12',
      telefono: '080 5461291',
    })
  })

  it('durante il salvataggio il pulsante è disabilitato', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockReturnValue(maiRisolta())
    const user = userEvent.setup()
    renderForm()

    await compila(user)
    await user.click(screen.getByTestId('salva-ente'))

    expect(screen.getByTestId('salva-ente')).toBeDisabled()
    expect(screen.getByTestId('salva-ente')).toHaveTextContent('Salvataggio')
  })

  it('i campi in errore del 400 del server compaiono accanto ai campi', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockRejectedValue(new api.ApiError(400, {
      title: 'Richiesta non valida',
      status: 400,
      detail: 'Alcuni campi del corpo non sono validi.',
      errori: [
        { campo: 'denominazione', messaggio: 'non deve essere vuoto' },
        { campo: 'tipo', messaggio: 'valore non valido per questo campo' },
        { campo: 'colore', messaggio: 'campo sconosciuto' },
      ],
    }))
    const user = userEvent.setup()
    renderForm()

    await compila(user)
    await user.click(screen.getByTestId('salva-ente'))

    expect(await screen.findByTestId('errore-denominazione')).toHaveTextContent('non deve essere vuoto')
    expect(screen.getByTestId('errore-tipo')).toHaveTextContent('valore non valido per questo campo')
    const alert = screen.getByTestId('error-alert')
    expect(alert).toHaveTextContent('Il server ha rifiutato alcuni campi')
    // un campo che il form non ha finisce nel riquadro in alto
    expect(alert).toHaveTextContent('colore: campo sconosciuto')
    expect(posizione(screen)).toBe('/enti/nuovo')
  })

  it('modificare un campo toglie il suo errore del server, non quello degli altri', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockRejectedValue(new api.ApiError(400, {
      title: 'Richiesta non valida',
      errori: [
        { campo: 'denominazione', messaggio: 'non deve essere vuoto' },
        { campo: 'comune', messaggio: 'non deve essere vuoto' },
      ],
    }))
    const user = userEvent.setup()
    renderForm()

    await compila(user)
    await user.click(screen.getByTestId('salva-ente'))
    await screen.findByTestId('errore-denominazione')

    await user.type(screen.getByTestId('campo-denominazione'), ' BIS')
    expect(screen.queryByTestId('errore-denominazione')).not.toBeInTheDocument()
    expect(screen.getByTestId('errore-comune')).toBeInTheDocument()
  })

  it('il 409 dice che l\'idSorgente esiste già, sul campo idSorgente', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockRejectedValue(new api.ApiError(409, {
      title: 'idSorgente già presente', status: 409, detail: 'Esiste già un ente con idSorgente 13436',
    }))
    const user = userEvent.setup()
    renderForm()

    await compila(user, { idSorgente: '13436' })
    await user.click(screen.getByTestId('salva-ente'))

    expect(await screen.findByTestId('errore-idSorgente')).toHaveTextContent('Esiste già un ente con idSorgente 13436')
    expect(screen.getByTestId('error-alert')).toHaveTextContent('idSorgente già presente')
    expect(screen.getByTestId('salva-ente')).toBeEnabled()
  })

  it('il 404 dice che la provincia non esiste, sul campo provincia', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockRejectedValue(new api.ApiError(404, {
      title: 'Risorsa inesistente', status: 404, detail: 'Provincia con id 6 inesistente',
    }))
    const user = userEvent.setup()
    renderForm()

    await compila(user, { provinciaId: '6' })
    await user.click(screen.getByTestId('salva-ente'))

    expect(await screen.findByTestId('errore-provinciaId')).toHaveTextContent('Provincia inesistente')
    const alert = screen.getByTestId('error-alert')
    expect(alert).toHaveTextContent('La provincia scelta non esiste')
    expect(alert).toHaveTextContent('Provincia con id 6 inesistente')
  })

  it('se il server non risponde lo dice e lascia i dati nel form', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'creaEnte').mockRejectedValue(new api.ApiError(0))
    const user = userEvent.setup()
    renderForm()

    await compila(user)
    await user.click(screen.getByTestId('salva-ente'))

    await waitFor(() => expect(screen.getByTestId('error-alert')).toHaveTextContent('server non risponde'))
    expect(screen.getByTestId('campo-denominazione')).toHaveValue('POLISPORTIVA SAN NICOLA')
  })
})
