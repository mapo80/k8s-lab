import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ErrorAlert from './ErrorAlert'
import { ApiError } from '../api/impiantiApi'

describe('ErrorAlert', () => {
  it('non mostra nulla se non c\'è errore', () => {
    const { container } = render(<ErrorAlert error={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra title e detail del ProblemDetail', () => {
    render(<ErrorAlert error={new ApiError(404, { title: 'Risorsa inesistente', detail: 'Ente con id 9 inesistente' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Risorsa inesistente')
    expect(screen.getByRole('alert')).toHaveTextContent('Ente con id 9 inesistente')
    expect(screen.getByTestId('error-alert')).toHaveAttribute('data-status', '404')
  })

  it('il titolo esplicito vince su quello del server', () => {
    render(<ErrorAlert error={new ApiError(404, { title: 'Risorsa inesistente', detail: 'x' })} title="Ente non trovato" />)
    expect(screen.getByText('Ente non trovato')).toBeInTheDocument()
    expect(screen.queryByText('Risorsa inesistente')).not.toBeInTheDocument()
  })

  it('senza ProblemDetail usa un titolo in base allo stato', () => {
    render(<ErrorAlert error={new ApiError(0)} />)
    expect(screen.getByText('Server non raggiungibile')).toBeInTheDocument()
    expect(screen.getByText(/server non risponde/)).toBeInTheDocument()
  })

  it('usa un titolo generico per uno stato sconosciuto e accetta un Error qualunque', () => {
    render(<ErrorAlert error={new Error('boom')} />)
    expect(screen.getByText('Si è verificato un errore')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('mostra il contenuto aggiuntivo', () => {
    render(<ErrorAlert error={new ApiError(503)}><p>Riprova tra 60 secondi</p></ErrorAlert>)
    expect(screen.getByText('Riprova tra 60 secondi')).toBeInTheDocument()
  })
})
