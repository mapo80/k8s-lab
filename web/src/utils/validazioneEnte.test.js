import { describe, expect, it } from 'vitest'
import { ENTE_VUOTO, corpoRichiesta, erroriDelServer, validaEnte } from './validazioneEnte'

const VALIDO = {
  idSorgente: '90001',
  denominazione: 'POLISPORTIVA SAN NICOLA',
  tipo: 'PRIVATO',
  provinciaId: '1',
  comune: 'Bari',
  indirizzo: '',
  telefono: '',
}

describe('validaEnte', () => {
  it('un ente con tutti i campi obbligatori è valido', () => {
    expect(validaEnte(VALIDO)).toEqual({})
  })

  it('il form vuoto segnala tutti i campi obbligatori, e non i facoltativi', () => {
    expect(Object.keys(validaEnte(ENTE_VUOTO)).sort())
      .toEqual(['comune', 'denominazione', 'idSorgente', 'provinciaId', 'tipo'])
  })

  it('un valore fatto solo di spazi è vuoto, come per @NotBlank', () => {
    expect(validaEnte({ ...VALIDO, denominazione: '   ' }).denominazione).toBe('Campo obbligatorio')
  })

  it.each([
    ['idSorgente', 20],
    ['denominazione', 100],
    ['comune', 100],
    ['indirizzo', 255],
    ['telefono', 30],
  ])('%s accetta fino a %i caratteri, come @Size nel backend', (campo, massimo) => {
    expect(validaEnte({ ...VALIDO, [campo]: 'x'.repeat(massimo) })[campo]).toBeUndefined()
    expect(validaEnte({ ...VALIDO, [campo]: 'x'.repeat(massimo + 1) })[campo])
      .toBe(`Al massimo ${massimo} caratteri (ora sono ${massimo + 1})`)
  })

  it('il telefono si misura con gli spazi: @Size li conta, li toglie il server dopo', () => {
    expect(validaEnte({ ...VALIDO, telefono: '080 546 1291 080 546 1291 080 5' }).telefono).toBeDefined()
  })

  it('il tipo deve essere PRIVATO o PUBBLICO', () => {
    expect(validaEnte({ ...VALIDO, tipo: 'PUBBLICO' }).tipo).toBeUndefined()
    expect(validaEnte({ ...VALIDO, tipo: 'ALTRO' }).tipo).toBe('Scegli il tipo di ente')
  })

  it('la provincia deve essere un id positivo', () => {
    expect(validaEnte({ ...VALIDO, provinciaId: '0' }).provinciaId).toBeDefined()
    expect(validaEnte({ ...VALIDO, provinciaId: 'abc' }).provinciaId).toBeDefined()
    expect(validaEnte({ ...VALIDO, provinciaId: '6' }).provinciaId).toBeUndefined()
  })
})

describe('corpoRichiesta', () => {
  it('converte la provincia in numero e i facoltativi vuoti in null', () => {
    expect(corpoRichiesta({ ...VALIDO, indirizzo: '  ', telefono: '080 5461291' })).toEqual({
      idSorgente: '90001',
      denominazione: 'POLISPORTIVA SAN NICOLA',
      tipo: 'PRIVATO',
      provinciaId: 1,
      comune: 'Bari',
      indirizzo: null,
      telefono: '080 5461291',
    })
  })
})

describe('erroriDelServer', () => {
  it('trasforma la lista del ProblemDetail in un oggetto per campo', () => {
    expect(erroriDelServer([
      { campo: 'comune', messaggio: 'non deve essere vuoto' },
      { campo: 'tipo', messaggio: 'valore non valido per questo campo' },
    ])).toEqual({ comune: 'non deve essere vuoto', tipo: 'valore non valido per questo campo' })
  })

  it('unisce più messaggi sullo stesso campo e tollera la lista assente', () => {
    expect(erroriDelServer([{ campo: 'a', messaggio: 'uno' }, { campo: 'a', messaggio: 'due' }])).toEqual({ a: 'uno; due' })
    expect(erroriDelServer(undefined)).toEqual({})
  })
})
