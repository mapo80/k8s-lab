import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProvincePage from './ProvincePage'
import * as api from '../api/impiantiApi'
import { PROVINCE, maiRisolta } from '../test/dati'
import { renderPagina } from '../test/utils'

describe('ProvincePage', () => {
  it('mostra lo spinner mentre carica', () => {
    vi.spyOn(api, 'getProvince').mockReturnValue(maiRisolta())
    renderPagina(<ProvincePage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carico le province')
  })

  it('mostra le sei province, ciascuna con il link ai suoi enti', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue(PROVINCE)
    renderPagina(<ProvincePage />)

    const schede = await screen.findAllByTestId('provincia-card')
    expect(schede).toHaveLength(6)
    expect(schede[4]).toHaveTextContent('Lecce')
    expect(schede[4]).toHaveAttribute('href', '/province/5')
  })

  it('mostra un errore se il caricamento fallisce', async () => {
    vi.spyOn(api, 'getProvince').mockRejectedValue(new api.ApiError(500, { title: 'Errore interno', detail: 'Si è verificato un errore imprevisto.' }))
    renderPagina(<ProvincePage />)
    expect(await screen.findByTestId('error-alert')).toHaveTextContent('Impossibile caricare le province')
  })

  it('senza province lo dice', async () => {
    vi.spyOn(api, 'getProvince').mockResolvedValue([])
    renderPagina(<ProvincePage />)
    expect(await screen.findByTestId('stato-vuoto')).toHaveTextContent('Nessuna provincia')
  })
})
