import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import * as api from './api/impiantiApi'
import { PAGINA_VUOTA, PROVINCE } from './test/dati'

function renderApp(percorso) {
  vi.spyOn(api, 'getEnti').mockResolvedValue(PAGINA_VUOTA)
  vi.spyOn(api, 'getEnte').mockResolvedValue({})
  vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
  return render(
    <MemoryRouter initialEntries={[percorso]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('la radice porta all\'elenco degli enti', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: /Enti proprietari/ })).toBeInTheDocument()
  })

  it('/enti/nuovo è il form, non il dettaglio di un ente con id «nuovo»', async () => {
    renderApp('/enti/nuovo')
    expect(await screen.findByTestId('form-ente')).toBeInTheDocument()
    expect(api.getEnte).not.toHaveBeenCalled()
  })

  it('la barra di navigazione porta a tutte le funzionalità', () => {
    renderApp('/importazione')
    const link = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(link).toEqual(expect.arrayContaining(['/enti', '/province', '/enti/nuovo', '/importazione']))
    expect(screen.getByRole('link', { name: 'Importazione' })).toHaveAttribute('aria-current', 'page')
  })

  it('un percorso sconosciuto mostra la pagina inesistente', () => {
    renderApp('/qualcosa')
    expect(screen.getByTestId('stato-vuoto')).toHaveTextContent('Pagina inesistente')
  })
})
