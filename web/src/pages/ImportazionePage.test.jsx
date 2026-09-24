import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ImportazionePage from './ImportazionePage'
import * as api from '../api/impiantiApi'
import { renderPagina } from '../test/utils'

function differita() {
  let risolvi
  const promessa = new Promise((ok) => {
    risolvi = ok
  })
  return { promessa, risolvi }
}

const ERRORE_503 = new api.ApiError(503, {
  title: 'Sorgente open data non disponibile',
  status: 503,
  detail: 'La sorgente open data non risponde: riprova più tardi.',
}, 60)

describe('ImportazionePage', () => {
  it('durante l\'importazione mostra lo stato e disabilita il pulsante', async () => {
    const importazione = differita()
    vi.spyOn(api, 'importaEnti').mockReturnValue(importazione.promessa)
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))

    expect(screen.getByTestId('avvia-import')).toBeDisabled()
    expect(screen.getByTestId('avvia-import')).toHaveTextContent('Importazione in corso')
    expect(screen.getByTestId('spinner')).toHaveTextContent('qualche secondo')

    importazione.risolvi({ inseriti: 1739, giaPresenti: 0, scartati: 1 })
    expect(await screen.findByTestId('esito-import')).toBeInTheDocument()
    expect(screen.getByTestId('avvia-import')).toBeEnabled()
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
  })

  it('alla prima importazione mostra i tre contatori', async () => {
    vi.spyOn(api, 'importaEnti').mockResolvedValue({ inseriti: 1739, giaPresenti: 0, scartati: 1 })
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))

    expect(await screen.findByTestId('esito-inseriti')).toHaveTextContent('1.739')
    expect(screen.getByTestId('esito-gia-presenti')).toHaveTextContent('0')
    expect(screen.getByTestId('esito-scartati')).toHaveTextContent('1')
    expect(screen.getByTestId('esito-messaggio')).toHaveTextContent('1.739 enti nuovi')
    expect(screen.getByTestId('vai-elenco')).toHaveAttribute('href', '/enti')
  })

  it('rilanciata, dice che gli enti erano già tutti presenti', async () => {
    vi.spyOn(api, 'importaEnti').mockResolvedValue({ inseriti: 0, giaPresenti: 1739, scartati: 1 })
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))

    expect(await screen.findByTestId('esito-gia-presenti')).toHaveTextContent('1.739')
    expect(screen.getByTestId('esito-messaggio')).toHaveTextContent('nessun ente nuovo')
  })

  it('sul 503 spiega che la sorgente non risponde e quando riprovare', async () => {
    vi.spyOn(api, 'importaEnti').mockRejectedValue(ERRORE_503)
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))

    const alert = await screen.findByTestId('error-alert')
    expect(alert).toHaveTextContent('La sorgente open data non risponde')
    expect(screen.getByTestId('riprova-tra')).toHaveTextContent('Riprova tra 60 secondi')
    expect(screen.queryByTestId('esito-import')).not.toBeInTheDocument()
    expect(screen.getByTestId('avvia-import')).toBeEnabled()
  })

  it('sul 503 senza Retry-After invita a riprovare più tardi', async () => {
    vi.spyOn(api, 'importaEnti').mockRejectedValue(new api.ApiError(503, null, null))
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))
    expect(await screen.findByTestId('riprova-tra')).toHaveTextContent('Riprova più tardi')
  })

  it('un altro errore si mostra come importazione non riuscita', async () => {
    vi.spyOn(api, 'importaEnti').mockRejectedValue(new api.ApiError(500, { title: 'Errore interno', detail: 'Si è verificato un errore imprevisto.' }))
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))

    const alert = await screen.findByTestId('error-alert')
    expect(alert).toHaveTextContent('Importazione non riuscita')
    expect(screen.queryByTestId('riprova-tra')).not.toBeInTheDocument()
  })

  it('un nuovo tentativo dopo il 503 cancella l\'errore', async () => {
    vi.spyOn(api, 'importaEnti')
      .mockRejectedValueOnce(ERRORE_503)
      .mockResolvedValueOnce({ inseriti: 1739, giaPresenti: 0, scartati: 1 })
    const user = userEvent.setup()
    renderPagina(<ImportazionePage />)

    await user.click(screen.getByTestId('avvia-import'))
    await screen.findByTestId('error-alert')
    await user.click(screen.getByTestId('avvia-import'))

    expect(await screen.findByTestId('esito-import')).toBeInTheDocument()
    expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument()
  })
})
