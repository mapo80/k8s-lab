import { describe, expect, it } from 'vitest'
import {
  aggiornaParametri,
  leggiOrdinamento,
  leggiParametri,
  prossimoOrdinamento,
  scriviOrdinamento,
} from './paginazione'

const CAMPI = ['denominazione', 'tipo', 'provincia.nome', 'comune']
const parametri = (query) => new URLSearchParams(query)

describe('leggiParametri', () => {
  it('senza parametri usa i default del backend: pagina 0, 20 righe, denominazione crescente', () => {
    expect(leggiParametri(parametri(''), CAMPI)).toEqual({
      page: 0,
      size: 20,
      sort: 'denominazione,asc',
      ordinamento: { campo: 'denominazione', direzione: 'asc' },
    })
  })

  it('legge page, size e sort dall\'URL', () => {
    expect(leggiParametri(parametri('page=3&size=50&sort=provincia.nome,desc'), CAMPI)).toMatchObject({
      page: 3,
      size: 50,
      sort: 'provincia.nome,desc',
    })
  })

  it('limita la dimensione a 100, come il backend', () => {
    expect(leggiParametri(parametri('size=100000'), CAMPI).size).toBe(100)
  })

  it('riporta al default i valori non validi invece di mandarli al backend', () => {
    expect(leggiParametri(parametri('page=-1&size=abc&sort=colore,asc'), CAMPI)).toMatchObject({
      page: 0,
      size: 20,
      sort: 'denominazione,asc',
    })
    expect(leggiParametri(parametri('size=0'), CAMPI).size).toBe(20)
    expect(leggiParametri(parametri('page=1.5'), CAMPI).page).toBe(0)
  })
})

describe('leggiOrdinamento', () => {
  it('accetta solo i campi ammessi e le direzioni asc e desc', () => {
    expect(leggiOrdinamento('comune,desc', CAMPI)).toEqual({ campo: 'comune', direzione: 'desc' })
    expect(leggiOrdinamento('comune,DESC', CAMPI)).toEqual({ campo: 'comune', direzione: 'desc' })
    expect(leggiOrdinamento('comune', CAMPI)).toEqual({ campo: 'comune', direzione: 'asc' })
    expect(leggiOrdinamento('telefono,asc', CAMPI)).toBeNull()
    expect(leggiOrdinamento('comune,su', CAMPI)).toBeNull()
    expect(leggiOrdinamento(null, CAMPI)).toBeNull()
  })

  it('scriviOrdinamento è l\'inverso', () => {
    expect(scriviOrdinamento({ campo: 'tipo', direzione: 'desc' })).toBe('tipo,desc')
  })
})

describe('prossimoOrdinamento', () => {
  const crescente = { campo: 'denominazione', direzione: 'asc' }

  it('sulla colonna già ordinata inverte la direzione', () => {
    expect(prossimoOrdinamento(crescente, 'denominazione')).toEqual({ campo: 'denominazione', direzione: 'desc' })
    expect(prossimoOrdinamento({ campo: 'denominazione', direzione: 'desc' }, 'denominazione'))
      .toEqual({ campo: 'denominazione', direzione: 'asc' })
  })

  it('su un\'altra colonna parte dal crescente', () => {
    expect(prossimoOrdinamento({ campo: 'denominazione', direzione: 'desc' }, 'comune'))
      .toEqual({ campo: 'comune', direzione: 'asc' })
  })
})

describe('aggiornaParametri', () => {
  it('cambiare pagina conserva dimensione e ordinamento', () => {
    expect(aggiornaParametri(parametri('page=0&size=50&sort=comune,asc'), { page: 3 }).toString())
      .toBe('page=3&size=50&sort=comune%2Casc')
  })

  it('cambiare dimensione o ordinamento torna alla prima pagina', () => {
    expect(aggiornaParametri(parametri('page=4&size=20'), { size: 100 }).get('page')).toBe('0')
    expect(aggiornaParametri(parametri('page=4'), { sort: 'tipo,asc' }).get('page')).toBe('0')
  })

  it('non modifica i parametri originali', () => {
    const originali = parametri('page=2')
    aggiornaParametri(originali, { page: 5 })
    expect(originali.get('page')).toBe('2')
  })
})
