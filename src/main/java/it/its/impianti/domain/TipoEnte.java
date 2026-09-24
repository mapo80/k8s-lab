package it.its.impianti.domain;

import java.util.Arrays;
import java.util.Optional;

/** Il tipo di ente. Nel file open data vale «Privato» o «Pubblico», con l'iniziale maiuscola. */
public enum TipoEnte {
    PRIVATO,
    PUBBLICO;

    /** La conversione dal valore del file: senza distinguere maiuscole e minuscole. */
    public static Optional<TipoEnte> daSorgente(String valore) {
        if (valore == null) {
            return Optional.empty();
        }
        String pulito = valore.trim();
        return Arrays.stream(values())
                .filter(tipo -> tipo.name().equalsIgnoreCase(pulito))
                .findFirst();
    }
}
