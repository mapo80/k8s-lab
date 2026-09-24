package it.its.impianti.domain;

public class EnteNonTrovatoException extends RuntimeException {

    public EnteNonTrovatoException(Long id) {
        super("Ente con id " + id + " inesistente");
    }
}
