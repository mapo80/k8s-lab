package it.its.impianti.domain;

/** La sorgente open data non risponde, o risponde con un errore: diventa un 503. */
public class SorgenteNonDisponibileException extends RuntimeException {

    public SorgenteNonDisponibileException(String messaggio, Throwable causa) {
        super(messaggio, causa);
    }
}
