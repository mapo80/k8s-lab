/**
 * La validazione del form «Nuovo ente», con le stesse regole di EnteRequest
 * nel backend: se il client la supera, il server non risponde 400.
 *
 *   idSorgente     @NotBlank @Size(max = 20)
 *   denominazione  @NotBlank @Size(max = 100)
 *   tipo           @NotNull, PRIVATO o PUBBLICO
 *   provinciaId    @NotNull @Positive
 *   comune         @NotBlank @Size(max = 100)
 *   indirizzo      @Size(max = 255)
 *   telefono       @Size(max = 30)
 *
 * Le lunghezze si misurano sul valore così come viene inviato, perché è lì
 * che le misura @Size: trim e rimozione degli spazi dal telefono li fa il
 * server dopo la validazione.
 */
import { TIPI_ENTE } from './formato'

export const LUNGHEZZE_MASSIME = {
  idSorgente: 20,
  denominazione: 100,
  comune: 100,
  indirizzo: 255,
  telefono: 30,
}

const OBBLIGATORI = ['idSorgente', 'denominazione', 'comune']

export const ENTE_VUOTO = {
  idSorgente: '',
  denominazione: '',
  tipo: '',
  provinciaId: '',
  comune: '',
  indirizzo: '',
  telefono: '',
}

/** { campo: messaggio } per ogni campo in errore; un oggetto vuoto se il form è valido. */
export function validaEnte(valori) {
  const errori = {}

  for (const campo of OBBLIGATORI) {
    if ((valori[campo] ?? '').trim() === '') errori[campo] = 'Campo obbligatorio'
  }
  for (const [campo, massimo] of Object.entries(LUNGHEZZE_MASSIME)) {
    const lunghezza = (valori[campo] ?? '').length
    if (!errori[campo] && lunghezza > massimo) {
      errori[campo] = `Al massimo ${massimo} caratteri (ora sono ${lunghezza})`
    }
  }
  if (!TIPI_ENTE.some((tipo) => tipo.valore === valori.tipo)) {
    errori.tipo = 'Scegli il tipo di ente'
  }
  const provincia = Number(valori.provinciaId)
  if (valori.provinciaId === '' || !Number.isInteger(provincia) || provincia <= 0) {
    errori.provinciaId = 'Scegli la provincia'
  }
  return errori
}

/** Il corpo di POST /enti: provinciaId numerico, i facoltativi vuoti a null. */
export function corpoRichiesta(valori) {
  const facoltativo = (valore) => (valore.trim() === '' ? null : valore)
  return {
    idSorgente: valori.idSorgente,
    denominazione: valori.denominazione,
    tipo: valori.tipo,
    provinciaId: Number(valori.provinciaId),
    comune: valori.comune,
    indirizzo: facoltativo(valori.indirizzo),
    telefono: facoltativo(valori.telefono),
  }
}

/** Gli errori [{ campo, messaggio }] di un 400 del server, come { campo: messaggio }. */
export function erroriDelServer(errori) {
  const perCampo = {}
  for (const { campo, messaggio } of errori ?? []) {
    perCampo[campo] = perCampo[campo] ? `${perCampo[campo]}; ${messaggio}` : messaggio
  }
  return perCampo
}
