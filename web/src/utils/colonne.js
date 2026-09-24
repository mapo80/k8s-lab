/**
 * Le colonne della tabella. "campo" è la proprietà su cui ordina il backend
 * (provincia.nome attraversa la relazione); le colonne senza campo non si
 * ordinano.
 */
export const COLONNE = [
  { id: 'denominazione', titolo: 'Denominazione', campo: 'denominazione' },
  { id: 'tipo', titolo: 'Tipo', campo: 'tipo' },
  { id: 'provincia', titolo: 'Provincia', campo: 'provincia.nome' },
  { id: 'comune', titolo: 'Comune', campo: 'comune' },
  { id: 'telefono', titolo: 'Telefono' },
]
