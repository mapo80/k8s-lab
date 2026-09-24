package it.its.impianti.domain;

public class ProvinciaNonTrovataException extends RuntimeException {

    public ProvinciaNonTrovataException(Long id) {
        super("Provincia con id " + id + " inesistente");
    }
}
