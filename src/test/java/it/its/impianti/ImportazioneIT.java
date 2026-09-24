package it.its.impianti;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import it.its.impianti.domain.Ente;
import it.its.impianti.domain.TipoEnte;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

/** L'importazione del file open data reale, dal client HTTP fino a PostgreSQL. */
class ImportazioneIT extends IntegrazioneBase {

    @Test
    @DisplayName("importa i 1.739 enti validi e scarta l'ultimo elemento { \"ID\": \"\" }")
    void primaImportazione() throws Exception {
        mvc.perform(post("/import/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inseriti").value(1739))
                .andExpect(jsonPath("$.giaPresenti").value(0))
                .andExpect(jsonPath("$.scartati").value(1));

        assertThat(enteRepository.count()).isEqualTo(1739);
    }

    @Test
    @DisplayName("idempotente: rilanciata non crea duplicati e non fallisce")
    void secondaImportazione() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());

        mvc.perform(post("/import/enti"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inseriti").value(0))
                .andExpect(jsonPath("$.giaPresenti").value(1739))
                .andExpect(jsonPath("$.scartati").value(1));

        assertThat(enteRepository.count()).isEqualTo(1739);
    }

    @Test
    @Transactional
    @DisplayName("i valori sono normalizzati come chiede la traccia")
    void valoriNormalizzati() throws Exception {
        mvc.perform(post("/import/enti")).andExpect(status().isOk());

        // l'esempio della traccia: telefono vuoto ricondotto a null, provincia come chiave esterna
        Ente europaPark = perIdSorgente("13436");
        assertThat(europaPark.getDenominazione()).isEqualTo("EUROPA PARK HOTEL");
        assertThat(europaPark.getTipo()).isEqualTo(TipoEnte.PRIVATO);
        assertThat(europaPark.getProvincia().getNome()).isEqualTo("Taranto");
        assertThat(europaPark.getTelefono()).isNull();

        // «0335 408787»: tutti gli spazi rimossi
        assertThat(perIdSorgente("14468").getTelefono()).isEqualTo("0335408787");
        // punto, barra e trattino conservati: il telefono non è un numero
        assertThat(perIdSorgente("12833").getTelefono()).isEqualTo("0831.412461");
        assertThat(perIdSorgente("13483").getTelefono()).isEqualTo("0881/542313");
        assertThat(perIdSorgente("13613").getTelefono()).isEqualTo("080-5461291");
        // «Oratorio »: trim sulla denominazione
        assertThat(perIdSorgente("14826").getDenominazione()).isEqualTo("Oratorio");
        // INDIRIZZO assente nel file
        assertThat(perIdSorgente("12727").getIndirizzo()).isNull();

        assertThat(enteRepository.findAll()).filteredOn(e -> e.getTipo() == TipoEnte.PUBBLICO).hasSize(264);
        assertThat(enteRepository.findAll()).allSatisfy(e -> {
            assertThat(e.getDenominazione()).isEqualTo(e.getDenominazione().strip());
            if (e.getTelefono() != null) {
                assertThat(e.getTelefono()).doesNotContainAnyWhitespaces();
            }
        });
    }

    @Test
    @DisplayName("se la sorgente open data non risponde: 503, e il database non cambia")
    void sorgenteNonDisponibile() throws Exception {
        statoOpenData = 500;

        mvc.perform(post("/import/enti"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.title").value("Sorgente open data non disponibile"));

        assertThat(enteRepository.count()).isZero();
    }

    private Ente perIdSorgente(String idSorgente) {
        return enteRepository.findAll().stream()
                .filter(e -> e.getIdSorgente().equals(idSorgente))
                .findFirst()
                .orElseThrow();
    }
}
