import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRichiesta } from './useRichiesta'

/** Una promessa da risolvere a mano, per decidere l'ordine delle risposte. */
function differita() {
  let risolvi
  let rifiuta
  const promessa = new Promise((ok, ko) => {
    risolvi = ok
    rifiuta = ko
  })
  return { promessa, risolvi, rifiuta }
}

describe('useRichiesta', () => {
  it('parte in caricamento, poi espone i dati', async () => {
    const richiesta = differita()
    const { result } = renderHook(() => useRichiesta(() => richiesta.promessa, 'a'))

    expect(result.current).toEqual({ dati: null, errore: null, caricamento: true })
    await act(async () => richiesta.risolvi([1, 2]))
    expect(result.current).toEqual({ dati: [1, 2], errore: null, caricamento: false })
  })

  it('espone l\'errore', async () => {
    const { result } = renderHook(() => useRichiesta(() => Promise.reject(new Error('boom')), 'a'))
    await waitFor(() => expect(result.current.errore?.message).toBe('boom'))
    expect(result.current.caricamento).toBe(false)
  })

  it('cambiando chiave tiene i dati vecchi finché arrivano i nuovi', async () => {
    const richieste = { a: differita(), b: differita() }
    const { result, rerender } = renderHook(({ chiave }) => useRichiesta(() => richieste[chiave].promessa, chiave),
      { initialProps: { chiave: 'a' } })
    await act(async () => richieste.a.risolvi('pagina a'))

    rerender({ chiave: 'b' })
    expect(result.current).toEqual({ dati: 'pagina a', errore: null, caricamento: true })

    await act(async () => richieste.b.risolvi('pagina b'))
    expect(result.current.dati).toBe('pagina b')
  })

  it('una risposta arrivata tardi, per una chiave vecchia, si ignora', async () => {
    const richieste = { a: differita(), b: differita() }
    const { result, rerender } = renderHook(({ chiave }) => useRichiesta(() => richieste[chiave].promessa, chiave),
      { initialProps: { chiave: 'a' } })

    rerender({ chiave: 'b' })
    await act(async () => richieste.b.risolvi('pagina b'))
    await act(async () => richieste.a.risolvi('pagina a, in ritardo'))

    expect(result.current).toEqual({ dati: 'pagina b', errore: null, caricamento: false })
  })
})
