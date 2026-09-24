import { describe, expect, it } from 'vitest'
import { etichettaTipo, formattaNumero, oTrattino } from './formato'

describe('formato', () => {
  it('formattaNumero usa il separatore delle migliaia italiano', () => {
    expect(formattaNumero(1739)).toBe('1.739')
    expect(formattaNumero(0)).toBe('0')
    expect(formattaNumero(null)).toBe('—')
  })

  it('oTrattino sostituisce i facoltativi assenti', () => {
    expect(oTrattino(null)).toBe('—')
    expect(oTrattino('')).toBe('—')
    expect(oTrattino('0831.412461')).toBe('0831.412461')
  })

  it('etichettaTipo traduce l\'enum e lascia com\'è un valore sconosciuto', () => {
    expect(etichettaTipo('PRIVATO')).toBe('Privato')
    expect(etichettaTipo('PUBBLICO')).toBe('Pubblico')
    expect(etichettaTipo('ALTRO')).toBe('ALTRO')
  })
})
