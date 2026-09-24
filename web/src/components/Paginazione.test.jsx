import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Paginazione from './Paginazione'

function renderPaginazione(props = {}) {
  const onPagina = vi.fn()
  const onDimensione = vi.fn()
  render(
    <Paginazione pagina={1} totalePagine={87} totaleElementi={1739} dimensione={20}
      onPagina={onPagina} onDimensione={onDimensione} {...props} />,
  )
  return { onPagina, onDimensione }
}

describe('Paginazione', () => {
  it('mostra la pagina da 1, il totale delle pagine e degli enti', () => {
    renderPaginazione()
    expect(screen.getByTestId('riepilogo-pagina')).toHaveTextContent('Pagina 2 di 87 · 1.739 enti')
  })

  it('sulla prima pagina disabilita prima e precedente', () => {
    renderPaginazione({ pagina: 0 })
    expect(screen.getByTestId('pagina-prima')).toBeDisabled()
    expect(screen.getByTestId('pagina-precedente')).toBeDisabled()
    expect(screen.getByTestId('pagina-successiva')).toBeEnabled()
  })

  it('sull\'ultima pagina disabilita successiva e ultima', () => {
    renderPaginazione({ pagina: 86 })
    expect(screen.getByTestId('pagina-successiva')).toBeDisabled()
    expect(screen.getByTestId('pagina-ultima')).toBeDisabled()
    expect(screen.getByTestId('pagina-precedente')).toBeEnabled()
  })

  it('con una pagina sola disabilita tutto', () => {
    renderPaginazione({ pagina: 0, totalePagine: 1, totaleElementi: 6 })
    for (const id of ['pagina-prima', 'pagina-precedente', 'pagina-successiva', 'pagina-ultima']) {
      expect(screen.getByTestId(id)).toBeDisabled()
    }
    expect(screen.getByTestId('riepilogo-pagina')).toHaveTextContent('Pagina 1 di 1 · 6 enti')
  })

  it('i pulsanti chiedono la pagina giusta, contata da 0', async () => {
    const user = userEvent.setup()
    const { onPagina } = renderPaginazione({ pagina: 5 })

    await user.click(screen.getByTestId('pagina-successiva'))
    await user.click(screen.getByTestId('pagina-precedente'))
    await user.click(screen.getByTestId('pagina-prima'))
    await user.click(screen.getByTestId('pagina-ultima'))

    expect(onPagina.mock.calls).toEqual([[6], [4], [0], [86]])
  })

  it('la scelta della dimensione arriva come numero, con 100 come massimo proposto', async () => {
    const user = userEvent.setup()
    const { onDimensione } = renderPaginazione()

    const opzioni = [...screen.getByTestId('dimensione-select').options].map((o) => o.value)
    expect(opzioni).toEqual(['10', '20', '50', '100'])

    await user.selectOptions(screen.getByTestId('dimensione-select'), '100')
    expect(onDimensione).toHaveBeenCalledWith(100)
  })

  it('una dimensione non standard presa dall\'URL resta selezionata', () => {
    renderPaginazione({ dimensione: 37 })
    expect(screen.getByTestId('dimensione-select')).toHaveValue('37')
  })
})
