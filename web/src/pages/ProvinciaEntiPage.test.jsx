import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProvinciaEntiPage from './ProvinciaEntiPage'
import * as api from '../api/impiantiApi'
import { COMUNE_CORATO, PAGINA_VUOTA, PROVINCE, maiRisolta, pagina } from '../test/dati'
import { posizione, renderPagina } from '../test/utils'

function renderProvincia(percorso) {
  return renderPagina(<ProvinciaEntiPage />, { percorso, rotta: '/province/:id' })
}

describe('ProvinciaEntiPage', () => {
  it('mostra lo spinner mentre carica', () => {
    vi.spyOn(api, 'getProvince').mockReturnValue(maiRisolta())
    vi.spyOn(api, 'getEntiDellaProvincia').mockReturnValue(maiRisolta())
    renderProvincia('/province/1')
    expect(screen.getByRole('status')).toHaveTextContent('Carico gli enti')
  })

  it('mostra il nome della provincia e i suoi enti, senza la colonna provincia', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'getEntiDellaProvincia').mockResolvedValue(pagina([COMUNE_CORATO], { totaleElementi: 377 }))
    renderProvincia('/province/1')

    expect(await screen.findByTestId('titolo-provincia')).toHaveTextContent('Enti della provincia di Bari')
    expect(await screen.findAllByTestId('riga-ente')).toHaveLength(1)
    expect(api.getEntiDellaProvincia).toHaveBeenCalledWith('1', { page: 0, size: 20, sort: 'denominazione,asc' })
    const intestazioni = within(screen.getByTestId('tabella-enti')).getAllByRole('columnheader').map((th) => th.textContent)
    expect(intestazioni.join(' ')).not.toMatch(/Provincia/)
    expect(screen.getByTestId('totale-elementi')).toHaveTextContent('377')
  })

  it('pagina e ordina come l\'elenco generale, con lo stato nell\'URL', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'getEntiDellaProvincia').mockResolvedValue(pagina([COMUNE_CORATO], { totaleElementi: 377 }))
    const user = userEvent.setup()
    renderProvincia('/province/1?size=50&sort=comune,desc')

    await screen.findAllByTestId('riga-ente')
    expect(api.getEntiDellaProvincia).toHaveBeenCalledWith('1', { page: 0, size: 50, sort: 'comune,desc' })

    await user.click(screen.getByTestId('pagina-successiva'))
    expect(posizione(screen)).toBe('/province/1?size=50&sort=comune%2Cdesc&page=1')
    await waitFor(() => expect(api.getEntiDellaProvincia).toHaveBeenLastCalledWith('1', { page: 1, size: 50, sort: 'comune,desc' }))
  })

  it('l\'ordinamento per provincia non ha senso qui e torna al default', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'getEntiDellaProvincia').mockResolvedValue(pagina([COMUNE_CORATO]))
    renderProvincia('/province/1?sort=provincia.nome,desc')

    await screen.findAllByTestId('riga-ente')
    expect(api.getEntiDellaProvincia).toHaveBeenCalledWith('1', { page: 0, size: 20, sort: 'denominazione,asc' })
  })

  it('una provincia inesistente mostra il 404', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'getEntiDellaProvincia').mockRejectedValue(
      new api.ApiError(404, { title: 'Risorsa inesistente', status: 404, detail: 'Provincia con id 99 inesistente' }),
    )
    renderProvincia('/province/99')

    const alert = await screen.findByTestId('error-alert')
    expect(alert).toHaveTextContent('Provincia non trovata')
    expect(alert).toHaveTextContent('Provincia con id 99 inesistente')
    expect(screen.getByTestId('titolo-provincia')).toHaveTextContent('Enti della provincia n. 99')
  })

  it('una provincia senza enti lo dice', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    vi.spyOn(api, 'getEntiDellaProvincia').mockResolvedValue(PAGINA_VUOTA)
    renderProvincia('/province/5')
    expect(await screen.findByTestId('stato-vuoto')).toHaveTextContent('Nessun ente in questa provincia')
  })
})
