package it.its.impianti.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Un elemento del file open data, così com'è: il DTO di confine.
 *
 * Le chiavi del file sono maiuscole, quindi ogni campo le dichiara con
 * {@code @JsonProperty}. CAP, EMAIL, FAX e PEC non si importano e sono
 * esclusi esplicitamente.
 */
@JsonIgnoreProperties({"CAP", "EMAIL", "FAX", "PEC"})
public record EnteSorgente(
        @JsonProperty("ID") String id,
        @JsonProperty("DENOMINAZIONE") String denominazione,
        @JsonProperty("TIPO") String tipo,
        @JsonProperty("PROVINCIA") String provincia,
        @JsonProperty("COMUNE") String comune,
        @JsonProperty("INDIRIZZO") String indirizzo,
        @JsonProperty("TELEFONO") String telefono) {
}
