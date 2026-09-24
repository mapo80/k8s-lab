import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EnteDettaglioPage from './EnteDettaglioPage'
import * as api from '../api/impiantiApi'
import { COMUNE_CORATO, EUROPA_PARK, maiRisolta } from '../test/dati'
import { renderPagina } from '../test/utils'

function renderDettaglio(id, stato) {
  return renderPagina(<EnteDettaglioPage />, { percorso: `/enti/${id}`, rotta: '/enti/:id', stato })
}

describe('EnteDettaglioPage', () => {
  it('mostra lo spinner mentre carica', () => {
    vi.spyOn(api, 'getEnte').mockReturnValue(maiRisolta())
    renderDettaglio(136)
    expect(screen.getByRole('status')).toHaveTextContent('Carico l\'ente')
  })

  it('chiede l\'ente dell\'URL e ne mostra tutti i campi, con il nome della provincia', async () => {
    vi.spyOn(api, 'getEnte').mockResolvedValue(COMUNE_CORATO)
    renderDettaglio(136)

    expect(await screen.findByTestId('dettaglio-denominazione')).toHaveTextContent('Comune di Corato')
    expect(api.getEnte).toHaveBeenCalledWith('136')
    expect(screen.getByTestId('dettaglio-idSorgente')).toHaveTextContent('12569')
    expect(screen.getByTestId('dettaglio-tipo')).toHaveTextContent('Pubblico')
    expect(screen.getByTestId('dettaglio-provincia')).toHaveTextContent('Bari')
    expect(screen.getByTestId('dettaglio-comune')).toHaveTextContent('Corato')
    expect(screen.getByTestId('dettaglio-indirizzo')).toHaveTextContent('Piazza Marconi, 12')
    expect(screen.getByTestId('dettaglio-telefono')).toHaveTextContent('0809592111')
    expect(screen.queryByTestId('ente-creato')).not.toBeInTheDocument()
  })

  it('i campi facoltativi assenti si mostrano come trattino', async () => {
    vi.spyOn(api, 'getEnte').mockResolvedValue(EUROPA_PARK)
    renderDettaglio(1)
    expect(await screen.findByTestId('dettaglio-telefono')).toHaveTextContent('—')
  })

  it('dopo la creazione conferma che l\'ente è stato salvato', async () => {
    vi.spyOn(api, 'getEnte').mockResolvedValue(COMUNE_CORATO)
    renderDettaglio(136, { creato: true })
    expect(await screen.findByTestId('ente-creato')).toHaveTextContent('Ente creato')
  })

  it('un ente inesistente mostra il 404 del server', async () => {
    vi.spyOn(api, 'getEnte').mockRejectedValue(
      new api.ApiError(404, { title: 'Risorsa inesistente', status: 404, detail: 'Ente con id 999999 inesistente' }),
    )
    renderDettaglio(999999)

    const alert = await screen.findByTestId('error-alert')
    expect(alert).toHaveTextContent('Ente non trovato')
    expect(alert).toHaveTextContent('Ente con id 999999 inesistente')
    expect(screen.queryByTestId('dettaglio-ente')).not.toBeInTheDocument()
    expect(screen.getByTestId('torna-elenco')).toHaveAttribute('href', '/enti')
  })

  it('un id non numerico mostra il 400 del server', async () => {
    vi.spyOn(api, 'getEnte').mockRejectedValue(new api.ApiError(400, { title: 'Parametro non valido', detail: 'Un parametro non è convertibile nel tipo atteso.' }))
    renderDettaglio('abc')
    expect(await screen.findByTestId('error-alert')).toHaveTextContent('Id non valido')
  })
})
