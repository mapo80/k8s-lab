import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EntiPage from './EntiPage'
import * as api from '../api/impiantiApi'
import { COMUNE_CORATO, EUROPA_PARK, PAGINA_VUOTA, maiRisolta, pagina } from '../test/dati'
import { posizione, renderPagina } from '../test/utils'

const PRIMA_PAGINA = pagina([COMUNE_CORATO, EUROPA_PARK], { totaleElementi: 1739 })

function renderEnti(percorso = '/enti') {
  return renderPagina(<EntiPage />, { percorso, rotta: '/enti' })
}

describe('EntiPage', () => {
  it('mostra lo spinner mentre carica', () => {
    vi.spyOn(api, 'getEnti').mockReturnValue(maiRisolta())
    renderEnti()
    expect(screen.getByRole('status')).toHaveTextContent('Carico gli enti')
  })

  it('senza parametri chiede la prima pagina da 20 per denominazione crescente', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PRIMA_PAGINA)
    renderEnti()

    expect(await screen.findAllByTestId('riga-ente')).toHaveLength(2)
    expect(api.getEnti).toHaveBeenCalledWith({ page: 0, size: 20, sort: 'denominazione,asc' })
    expect(screen.getByTestId('totale-elementi')).toHaveTextContent('1.739')
    expect(screen.getByTestId('riepilogo-pagina')).toHaveTextContent('Pagina 1 di 87')
  })

  it('legge pagina, dimensione e ordinamento dall\'URL', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(pagina([EUROPA_PARK], { pagina: 2, dimensione: 50, totaleElementi: 1739 }))
    renderEnti('/enti?page=2&size=50&sort=comune,desc')

    await screen.findByTestId('riga-ente')
    expect(api.getEnti).toHaveBeenCalledWith({ page: 2, size: 50, sort: 'comune,desc' })
    expect(screen.getByTestId('dimensione-select')).toHaveValue('50')
    expect(screen.getByTestId('riepilogo-pagina')).toHaveTextContent('Pagina 3 di 35')
  })

  it('i parametri non validi dell\'URL tornano ai default, e la dimensione non supera 100', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PRIMA_PAGINA)
    renderEnti('/enti?page=x&size=5000&sort=colore,su')

    await screen.findAllByTestId('riga-ente')
    expect(api.getEnti).toHaveBeenCalledWith({ page: 0, size: 100, sort: 'denominazione,asc' })
  })

  it('la pagina successiva finisce nell\'URL e nella richiesta', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PRIMA_PAGINA)
    const user = userEvent.setup()
    renderEnti()

    await screen.findAllByTestId('riga-ente')
    await user.click(screen.getByTestId('pagina-successiva'))

    expect(posizione(screen)).toBe('/enti?page=1')
    await waitFor(() => expect(api.getEnti).toHaveBeenLastCalledWith({ page: 1, size: 20, sort: 'denominazione,asc' }))
  })

  it('cambiare la dimensione torna alla prima pagina', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PRIMA_PAGINA)
    const user = userEvent.setup()
    renderEnti('/enti?page=4')

    await screen.findAllByTestId('riga-ente')
    await user.selectOptions(screen.getByTestId('dimensione-select'), '100')

    expect(posizione(screen)).toBe('/enti?page=0&size=100')
    await waitFor(() => expect(api.getEnti).toHaveBeenLastCalledWith({ page: 0, size: 100, sort: 'denominazione,asc' }))
  })

  it('il clic sulla colonna ordinata inverte la direzione, su un\'altra parte dal crescente', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PRIMA_PAGINA)
    const user = userEvent.setup()
    renderEnti('/enti?page=3')

    await screen.findAllByTestId('riga-ente')
    await user.click(screen.getByTestId('ordina-denominazione'))
    expect(posizione(screen)).toBe('/enti?page=0&sort=denominazione%2Cdesc')
    await waitFor(() => expect(api.getEnti).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'denominazione,desc' }))

    await user.click(screen.getByTestId('ordina-provincia'))
    expect(posizione(screen)).toBe('/enti?page=0&sort=provincia.nome%2Casc')
    await waitFor(() => expect(api.getEnti).toHaveBeenLastCalledWith({ page: 0, size: 20, sort: 'provincia.nome,asc' }))
  })

  it('mostra un errore se il caricamento fallisce', async () => {
    vi.spyOn(api, 'getEnti').mockRejectedValue(new api.ApiError(0))
    renderEnti()

    const alert = await screen.findByTestId('error-alert')
    expect(alert).toHaveTextContent('Impossibile caricare gli enti')
    expect(alert).toHaveTextContent('server non risponde')
  })

  it('prima dell\'importazione invita a importare o a creare un ente', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(PAGINA_VUOTA)
    renderEnti()

    expect(await screen.findByTestId('stato-vuoto')).toHaveTextContent('Non ci sono ancora enti')
    expect(screen.getByTestId('vuoto-link-import')).toHaveAttribute('href', '/importazione')
    expect(screen.queryByTestId('paginazione')).not.toBeInTheDocument()
  })

  it('una pagina oltre l\'ultima lo dice e porta all\'ultima', async () => {
    vi.spyOn(api, 'getEnti').mockResolvedValue(pagina([], { pagina: 999, totaleElementi: 1739 }))
    const user = userEvent.setup()
    renderEnti('/enti?page=999')

    expect(await screen.findByTestId('stato-vuoto')).toHaveTextContent('La pagina 1000 non esiste')
    await user.click(screen.getByTestId('vai-ultima-pagina'))
    expect(posizione(screen)).toBe('/enti?page=86')
  })
})
