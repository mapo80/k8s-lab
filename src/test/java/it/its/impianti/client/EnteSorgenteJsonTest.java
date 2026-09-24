package it.its.impianti.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Il DTO di confine legge il formato del file open data. */
class EnteSorgenteJsonTest {

    /*
     * FAIL_ON_UNKNOWN_PROPERTIES attivo: se CAP, EMAIL, FAX e PEC non fossero
     * esclusi esplicitamente, la lettura fallirebbe.
     */
    private final JsonMapper json = JsonMapper.builder()
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    @Test
    @DisplayName("la radice è un array: si legge come lista, con le chiavi maiuscole")
    void leggeLaLista() {
        String file = """
                [
                  { "ID": "13436", "DENOMINAZIONE": "EUROPA PARK HOTEL", "TIPO": "Privato",
                    "PROVINCIA": "Taranto", "COMUNE": "Ginosa", "INDIRIZZO": "VIA DELLA CHIESA",
                    "TELEFONO": "", "CAP": "24534" },
                  { "ID": "" }
                ]
                """;

        List<EnteSorgente> enti = json.readValue(file, new TypeReference<List<EnteSorgente>>() { });

        assertThat(enti).hasSize(2);
        assertThat(enti.get(0)).isEqualTo(new EnteSorgente("13436", "EUROPA PARK HOTEL", "Privato",
                "Taranto", "Ginosa", "VIA DELLA CHIESA", ""));
        assertThat(enti.get(1).id()).isEmpty();
        assertThat(enti.get(1).denominazione()).isNull();
    }

    @Test
    @DisplayName("CAP, EMAIL, FAX e PEC sono ignorati")
    void ignoraICampiNonImportati() {
        String file = """
                [ { "ID": "1", "DENOMINAZIONE": "A", "TIPO": "Pubblico", "PROVINCIA": "Bari",
                    "COMUNE": "Bari", "CAP": "70100", "EMAIL": "a@b.it", "FAX": "080", "PEC": "a@pec.it" } ]
                """;

        List<EnteSorgente> enti = json.readValue(file, new TypeReference<List<EnteSorgente>>() { });

        assertThat(enti).singleElement().satisfies(e -> {
            assertThat(e.id()).isEqualTo("1");
            assertThat(e.indirizzo()).isNull();
            assertThat(e.telefono()).isNull();
        });
    }
}
