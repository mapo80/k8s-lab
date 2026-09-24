package it.its.impianti.domain;

public class IdSorgenteDuplicatoException extends RuntimeException {

    public IdSorgenteDuplicatoException(String idSorgente) {
        super("Esiste già un ente con idSorgente " + idSorgente);
    }
}
