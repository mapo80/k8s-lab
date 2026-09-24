import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import TabellaEnti from './TabellaEnti'
import { COMUNE_CORATO, EUROPA_PARK } from '../test/dati'

function renderTabella(props = {}) {
  const onOrdina = vi.fn()
  render(
    <MemoryRouter>
      <TabellaEnti enti={[EUROPA_PARK, COMUNE_CORATO]}
        ordinamento={{ campo: 'denominazione', direzione: 'asc' }} onOrdina={onOrdina} {...props} />
    </MemoryRouter>,
  )
  return { onOrdina }
}

describe('TabellaEnti', () => {
  it('una riga per ente, con il nome della provincia e il tipo leggibile', () => {
    renderTabella()
    const righe = screen.getAllByTestId('riga-ente')
    expect(righe).toHaveLength(2)
    expect(righe[1]).toHaveTextContent('Comune di Corato')
    expect(righe[1]).toHaveTextContent('Pubblico')
    expect(righe[1]).toHaveTextContent('Bari')
    expect(righe[1]).toHaveTextContent('0809592111')
  })

  it('la denominazione porta al dettaglio dell\'ente', () => {
    renderTabella()
    const [prima] = screen.getAllByTestId('link-ente')
    expect(prima).toHaveAttribute('href', '/enti/1')
  })

  it('un telefono assente si mostra come trattino', () => {
    renderTabella()
    const riga = screen.getAllByTestId('riga-ente')[0]
    expect(riga.querySelector('[data-colonna="telefono"]')).toHaveTextContent('—')
  })

  it('segna la colonna ordinata con aria-sort', () => {
    renderTabella({ ordinamento: { campo: 'provincia.nome', direzione: 'desc' } })
    const intestazioni = screen.getAllByRole('columnheader')
    expect(intestazioni.find((th) => th.textContent.includes('Provincia'))).toHaveAttribute('aria-sort', 'descending')
    expect(intestazioni.find((th) => th.textContent.includes('Denominazione'))).toHaveAttribute('aria-sort', 'none')
  })

  it('il clic su un\'intestazione chiede l\'ordinamento per il campo del backend', async () => {
    const user = userEvent.setup()
    const { onOrdina } = renderTabella()

    await user.click(screen.getByTestId('ordina-provincia'))
    await user.click(screen.getByTestId('ordina-denominazione'))

    expect(onOrdina.mock.calls).toEqual([['provincia.nome'], ['denominazione']])
  })

  it('il telefono non è ordinabile', () => {
    renderTabella()
    const telefono = screen.getAllByRole('columnheader').find((th) => th.textContent === 'Telefono')
    expect(within(telefono).queryByRole('button')).not.toBeInTheDocument()
  })
})
